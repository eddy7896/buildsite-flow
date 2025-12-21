#!/bin/bash
# Production Deployment Script
# Handles complete production deployment with multi-tenant database setup

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 BuildFlow ERP - Production Deployment${NC}"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo "Creating from template..."
    cp .env.production.example .env.production
    echo -e "${RED}❌ Please update .env.production with your production values before continuing!${NC}"
    echo "   - Change all passwords"
    echo "   - Set JWT secret"
    echo "   - Configure domains"
    exit 1
fi

# Check for critical environment variables
source .env.production 2>/dev/null || true

if [ "${POSTGRES_PASSWORD}" = "CHANGE_THIS_STRONG_PASSWORD" ] || [ -z "${POSTGRES_PASSWORD}" ]; then
    echo -e "${RED}❌ POSTGRES_PASSWORD not set in .env.production${NC}"
    exit 1
fi

if [ "${VITE_JWT_SECRET}" = "CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET" ] || [ -z "${VITE_JWT_SECRET}" ]; then
    echo -e "${RED}❌ VITE_JWT_SECRET not set in .env.production${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p data/postgres
mkdir -p data/storage
mkdir -p data/logs
mkdir -p database/backups
chmod 755 data/postgres data/storage data/logs database/backups

# Build images
echo -e "${BLUE}🔨 Building production images...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down

# Start services
echo -e "${BLUE}🚀 Starting production services...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose -f docker-compose.prod.yml ps | grep -q "healthy\|Up"; then
        echo -e "${GREEN}✅ Services are starting up...${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done

# Verify database
echo -e "${BLUE}🗄️  Verifying database connection...${NC}"
if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is ready${NC}"
else
    echo -e "${RED}❌ Database is not ready${NC}"
    exit 1
fi

# Run multi-tenant verification
echo -e "${BLUE}🔍 Verifying multi-tenant database isolation...${NC}"
if [ -f "scripts/verify-multi-tenant.sh" ]; then
    chmod +x scripts/verify-multi-tenant.sh
    docker compose -f docker-compose.prod.yml exec -T postgres bash -c "PGHOST=postgres PGPORT=5432 PGUSER=${POSTGRES_USER:-postgres} PGPASSWORD=${POSTGRES_PASSWORD} POSTGRES_DB=${POSTGRES_DB:-buildflow_db} /bin/sh" < scripts/verify-multi-tenant.sh || true
fi

# Check backend health
echo -e "${BLUE}🏥 Checking backend health...${NC}"
sleep 5
if curl -f http://localhost:${BACKEND_PORT:-3000}/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (may still be starting)${NC}"
fi

# Display service status
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Production Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Service Status:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Access Points:"
echo "  - Frontend: http://localhost:${FRONTEND_PORT:-8080}"
echo "  - Backend API: http://localhost:${BACKEND_PORT:-3000}/api"
echo "  - Database: localhost:${POSTGRES_PORT:-5432}"
echo ""
echo "Useful Commands:"
echo "  - View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services: docker compose -f docker-compose.prod.yml down"
echo "  - Restart: docker compose -f docker-compose.prod.yml restart"
echo ""
