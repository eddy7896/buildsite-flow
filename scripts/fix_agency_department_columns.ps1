# PowerShell script to add missing columns to departments table in agency databases
# This fixes the "column manager_id does not exist" error for existing agencies

param(
    [string]$AgencyDatabase = "",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "admin"
)

$env:PGPASSWORD = $DbPassword

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Fix Department Columns in Agency Database" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Migration SQL
$migrationSQL = @"
-- Add missing columns to departments table
ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS budget NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_department_id ON public.departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_agency_id ON public.departments(agency_id);
"@

if ($AgencyDatabase) {
    # Fix specific agency database
    Write-Host "Fixing agency database: $AgencyDatabase" -ForegroundColor Yellow
    $migrationSQL | psql -h $DbHost -p $DbPort -U $DbUser -d $AgencyDatabase
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully fixed $AgencyDatabase" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to fix $AgencyDatabase" -ForegroundColor Red
    }
} else {
    # List all agency databases and fix them
    Write-Host "Finding all agency databases..." -ForegroundColor Yellow
    
    $query = "SELECT database_name FROM public.agencies WHERE database_name IS NOT NULL AND is_active = true;"
    $databases = $query | psql -h $DbHost -p $DbPort -U $DbUser -d buildflow_db -t -A
    
    if ($databases) {
        $dbList = $databases -split "`n" | Where-Object { $_.Trim() -ne "" }
        Write-Host "Found $($dbList.Count) agency database(s)" -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($db in $dbList) {
            $db = $db.Trim()
            if ($db) {
                Write-Host "Fixing: $db" -ForegroundColor Yellow
                $migrationSQL | psql -h $DbHost -p $DbPort -U $DbUser -d $db
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✓ Success" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ Failed" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "No agency databases found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
