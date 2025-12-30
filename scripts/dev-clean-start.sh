#!/bin/bash
# Clean and restart development environment

echo "🧹 Cleaning up Docker containers and volumes..."
docker-compose -f docker-compose.dev.yml down -v

echo "🗑️  Removing old containers..."
docker rm -f buildflow-backend-dev buildflow-frontend-dev buildflow-postgres-dev buildflow-redis-dev 2>/dev/null || true

echo "📦 Building and starting fresh development environment..."
docker-compose -f docker-compose.dev.yml up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "📊 Checking service status..."
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ Development environment is starting!"
echo "📝 View logs with: npm run docker:dev:logs"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000/api"
echo ""
echo "Waiting for services to be fully ready..."

