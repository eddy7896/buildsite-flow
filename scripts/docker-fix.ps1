# Docker Build Fix Script
# This script helps fix common Docker build issues and optimizes the build process

param(
    [switch]$PullImages,
    [switch]$CleanCache,
    [switch]$Verbose
)

Write-Host "🐳 Docker Build Fix Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Enable BuildKit
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"

Write-Host "✅ BuildKit enabled" -ForegroundColor Green

# Check Docker is running
Write-Host "`nChecking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Clean cache if requested
if ($CleanCache) {
    Write-Host "`nCleaning Docker cache..." -ForegroundColor Yellow
    docker system prune -f
    Write-Host "✅ Cache cleaned" -ForegroundColor Green
}

# Pull base images if requested
if ($PullImages) {
    Write-Host "`nPulling base images..." -ForegroundColor Yellow
    $images = @(
        "node:20-alpine",
        "postgres:15-alpine",
        "redis:7-alpine"
    )
    
    foreach ($image in $images) {
        Write-Host "  Pulling $image..." -ForegroundColor Gray
        docker pull $image
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $image pulled successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Failed to pull $image (will retry during build)" -ForegroundColor Yellow
        }
    }
}

# Check network connectivity
Write-Host "`nChecking network connectivity..." -ForegroundColor Yellow
$testConnection = Test-NetConnection -ComputerName registry-1.docker.io -Port 443 -WarningAction SilentlyContinue
if ($testConnection.TcpTestSucceeded) {
    Write-Host "✅ Docker Hub is reachable" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cannot reach Docker Hub. Check your internet connection or firewall." -ForegroundColor Yellow
    Write-Host "   You may need to configure a proxy or use a VPN." -ForegroundColor Yellow
}

# Build command
Write-Host "`n🚀 Starting Docker build..." -ForegroundColor Cyan
Write-Host ""

$buildArgs = @(
    "-f", "docker-compose.dev.yml",
    "build"
)

if ($Verbose) {
    $buildArgs += "--progress=plain"
}

# Execute build
docker compose $buildArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "`nTo start the services, run:" -ForegroundColor Cyan
    Write-Host "  docker compose -f docker-compose.dev.yml up" -ForegroundColor White
} else {
    Write-Host "`n❌ Build failed. Check the error messages above." -ForegroundColor Red
    Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
    Write-Host "  1. Check your internet connection" -ForegroundColor White
    Write-Host "  2. Try: .\scripts\docker-fix.ps1 -PullImages" -ForegroundColor White
    Write-Host "  3. Try: .\scripts\docker-fix.ps1 -CleanCache" -ForegroundColor White
    Write-Host "  4. Check Docker Desktop resources (Settings → Resources)" -ForegroundColor White
    Write-Host "  5. See DOCKER_FIX_GUIDE.md for more help" -ForegroundColor White
    exit 1
}

