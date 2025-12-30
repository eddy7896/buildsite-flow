# Clean and restart development environment (PowerShell)

Write-Host "🧹 Cleaning up Docker containers and volumes..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml down -v

Write-Host "🗑️  Removing old containers..." -ForegroundColor Yellow
docker rm -f buildflow-backend-dev buildflow-frontend-dev buildflow-postgres-dev buildflow-redis-dev 2>$null

Write-Host "📦 Building and starting fresh development environment..." -ForegroundColor Green
docker-compose -f docker-compose.dev.yml up --build -d

Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📊 Checking service status..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "✅ Development environment is starting!" -ForegroundColor Green
Write-Host "📝 View logs with: npm run docker:dev:logs" -ForegroundColor White
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "🔧 Backend: http://localhost:3000/api" -ForegroundColor White
Write-Host ""
Write-Host "Waiting for services to be fully ready..." -ForegroundColor Yellow

