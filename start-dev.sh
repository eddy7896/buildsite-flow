#!/bin/bash

# Development Startup Script
# Starts database/Redis in Docker, then backend and frontend locally

echo "🚀 Starting BuildFlow Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database and Redis services
echo "📦 Starting database and Redis services..."
docker-compose -f docker-compose.services.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are healthy
if docker ps | grep -q "buildflow-postgres-services.*healthy"; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL might not be ready yet, but continuing..."
fi

if docker ps | grep -q "buildflow-redis-services"; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis might not be ready yet, but continuing..."
fi

echo ""
echo "🎯 Starting backend and frontend..."
echo ""
echo "📝 Backend will run on: http://localhost:3000"
echo "📝 Frontend will run on: http://localhost:5173"
echo ""
echo "💡 Tip: Press Ctrl+C to stop all services"
echo ""

# Start backend in background
echo "🔧 Starting backend server..."
cd src/server
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend dev server..."
npm run dev

# Cleanup on exit
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID 2>/dev/null; docker-compose -f docker-compose.services.yml down; exit" INT TERM

