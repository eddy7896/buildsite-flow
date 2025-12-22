# Vite Cache Cleanup Script
Write-Host "Cleaning Vite cache..." -ForegroundColor Yellow

# Stop any running Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove Vite cache directories
if (Test-Path "node_modules\.vite") {
    Remove-Item -Path "node_modules\.vite" -Recurse -Force
    Write-Host "✓ Removed node_modules\.vite" -ForegroundColor Green
}

if (Test-Path ".vite") {
    Remove-Item -Path ".vite" -Recurse -Force
    Write-Host "✓ Removed .vite" -ForegroundColor Green
}

# Clear npm cache (optional, more thorough)
# npm cache clean --force

Write-Host "`nCache cleanup complete! Restart your dev server with: npm run dev" -ForegroundColor Green

