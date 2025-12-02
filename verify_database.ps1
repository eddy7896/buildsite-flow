# Database Verification Script for Windows PowerShell
# This script helps verify the database schema matches the expected structure

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Schema Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql command not found. Please install PostgreSQL client." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Get database connection details
if (-not $env:DATABASE_URL) {
    Write-Host "Please provide database connection details:" -ForegroundColor Yellow
    Write-Host ""
    
    $DB_HOST = Read-Host "Database host [localhost]"
    if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }
    
    $DB_PORT = Read-Host "Database port [5432]"
    if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "5432" }
    
    $DB_NAME = Read-Host "Database name"
    $DB_USER = Read-Host "Database user"
    
    $securePassword = Read-Host "Database password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $env:PGPASSWORD = $DB_PASSWORD
    $DB_CONN = "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
} else {
    $DB_CONN = "psql $env:DATABASE_URL"
}

Write-Host ""
Write-Host "Connecting to database..." -ForegroundColor Green
Write-Host ""

# Run verification queries
if (Test-Path "verify_database_schema.sql") {
    Invoke-Expression "$DB_CONN -f verify_database_schema.sql"
} else {
    Write-Host "ERROR: verify_database_schema.sql not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Quick Schema Check Commands:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check holidays table structure:" -ForegroundColor Yellow
Write-Host "  $DB_CONN -c `"\d holidays`""
Write-Host ""
Write-Host "To check company_events table structure:" -ForegroundColor Yellow
Write-Host "  $DB_CONN -c `"\d company_events`""
Write-Host ""
Write-Host "To check for incorrect columns:" -ForegroundColor Yellow
Write-Host "  $DB_CONN -c `"SELECT column_name FROM information_schema.columns WHERE table_name = 'holidays' AND column_name IN ('type', 'is_mandatory');`""
Write-Host "  $DB_CONN -c `"SELECT column_name FROM information_schema.columns WHERE table_name = 'company_events' AND column_name = 'is_all_day';`""
Write-Host ""

