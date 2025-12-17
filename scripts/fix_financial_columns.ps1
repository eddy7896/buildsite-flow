# PowerShell script to add missing financial multi-tenant columns in agency databases
# Fixes "agency_id does not exist" and "line_number does not exist" errors

param(
    [string]$AgencyDatabase = "",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "admin"
)

$env:PGPASSWORD = $DbPassword

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Fix Financial Columns in Agency Database" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Migration SQL for a single agency database
$migrationSQL = @"
-- Jobs: add agency_id for multi-tenant scoping
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS agency_id UUID;

CREATE INDEX IF NOT EXISTS idx_jobs_agency_id ON public.jobs(agency_id);

-- Chart of Accounts: add agency_id for multi-tenant scoping
ALTER TABLE public.chart_of_accounts
ADD COLUMN IF NOT EXISTS agency_id UUID;

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_agency_id ON public.chart_of_accounts(agency_id);

-- Journal Entries: add agency_id and total_debit/total_credit
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS agency_id UUID;

ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS total_debit NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS total_credit NUMERIC(15, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_journal_entries_agency_id ON public.journal_entries(agency_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON public.journal_entries(status);

-- Journal Entry Lines: add line_number and backfill ordering
ALTER TABLE public.journal_entry_lines
ADD COLUMN IF NOT EXISTS line_number INTEGER;

-- Backfill line_number for existing rows where it is NULL or zero
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY journal_entry_id
           ORDER BY created_at, id
         ) AS rn
  FROM public.journal_entry_lines
)
UPDATE public.journal_entry_lines jel
SET line_number = numbered.rn
FROM numbered
WHERE jel.id = numbered.id
  AND (jel.line_number IS NULL OR jel.line_number = 0);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_entry_id_line_number 
  ON public.journal_entry_lines(journal_entry_id, line_number);
"@

if ($AgencyDatabase) {
    # Fix specific agency database
    Write-Host "Fixing financial columns in agency database: $AgencyDatabase" -ForegroundColor Yellow
    $migrationSQL | psql -h $DbHost -p $DbPort -U $DbUser -d $AgencyDatabase
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully fixed financial schema in $AgencyDatabase" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to fix financial schema in $AgencyDatabase" -ForegroundColor Red
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
                Write-Host "Fixing financial schema in: $db" -ForegroundColor Yellow
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
Write-Host "Financial schema fix complete" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
