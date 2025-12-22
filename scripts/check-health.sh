#!/bin/bash
# Health Check Script for BuildFlow Services
# Run this to verify all services are healthy

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏥 BuildFlow Health Check${NC}"
echo ""

# Check if docker-compose file exists
if [ -f "docker-compose.hostinger.yml" ]; then
    COMPOSE_FILE="docker-compose.hostinger.yml"
elif [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if services are running
echo -e "${BLUE}📊 Service Status:${NC}"
$DOCKER_COMPOSE -f "$COMPOSE_FILE" ps
echo ""

# Check PostgreSQL
echo -e "${BLUE}🗄️  Checking PostgreSQL...${NC}"
if $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not responding${NC}"
fi
echo ""

# Check Redis
echo -e "${BLUE}🔴 Checking Redis...${NC}"
if $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Redis may not be responding (check password)${NC}"
fi
echo ""

# Check Backend API
echo -e "${BLUE}🔧 Checking Backend API...${NC}"
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
    echo "Response: $HEALTH_RESPONSE" | head -c 200
    echo ""
else
    echo -e "${RED}❌ Backend API is not responding${NC}"
fi
echo ""

# Check Frontend
echo -e "${BLUE"🌐 Checking Frontend...${NC}"
if curl -f http://localhost/health > /dev/null 2>&1 || curl -f http://localhost:80/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health endpoint not responding (may be normal)${NC}"
fi
echo ""

# Check disk space
echo -e "${BLUE}💾 Disk Space:${NC}"
df -h | grep -E '^/dev|Filesystem' | head -2
echo ""

# Check memory
echo -e "${BLUE}🧠 Memory Usage:${NC}"
free -h
echo ""

# Docker stats
echo -e "${BLUE}🐳 Docker Container Stats:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Unable to get stats"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Health check complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

