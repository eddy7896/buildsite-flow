# Development Startup Script for Windows PowerShell
# Starts database/Redis in Docker, then backend and frontend locally

Write-Host "🚀 Starting BuildFlow Development Environment" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if frontend dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if backend dependencies are installed
if (-not (Test-Path "src/server/node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location src/server
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

# Start database and Redis services
Write-Host "📦 Starting database and Redis services..." -ForegroundColor Yellow
docker-compose -f docker-compose.services.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if services are running
$postgresRunning = docker ps | Select-String "buildflow-postgres-services"
$redisRunning = docker ps | Select-String "buildflow-redis-services"

if ($postgresRunning) {
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL might not be ready yet, but continuing..." -ForegroundColor Yellow
}

if ($redisRunning) {
    Write-Host "✅ Redis is ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis might not be ready yet, but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Starting backend and frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Backend will run on: http://localhost:3000" -ForegroundColor White
Write-Host "📝 Frontend will run on: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host ""

# Start backend in a new window
Write-Host "🔧 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/server; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting frontend dev server..." -ForegroundColor Yellow
npm run dev

