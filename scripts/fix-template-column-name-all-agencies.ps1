# PowerShell script to rename template_content to template_data in all agency databases

$env:PGPASSWORD = 'admin'
$PGUSER = 'postgres'
$PGHOST = 'localhost'
$PGPORT = '5432'
$MAIN_DB = 'buildflow_db'

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Renaming template_content to template_data" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get all agency database names from main database
Write-Host "Fetching agency database names..." -ForegroundColor Yellow
$dbNamesQuery = "SELECT database_name FROM public.agencies WHERE database_name IS NOT NULL;"
$dbNamesResult = & psql -U $PGUSER -d $MAIN_DB -t -c $dbNamesQuery

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error fetching agency database names!" -ForegroundColor Red
    exit 1
}

$dbNames = $dbNamesResult | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_.Trim() }

if ($dbNames.Count -eq 0) {
    Write-Host "No agency databases found." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($dbNames.Count) agency databases" -ForegroundColor Green
Write-Host ""

$successCount = 0
$errorCount = 0
$skippedCount = 0

foreach ($dbName in $dbNames) {
    Write-Host "Processing: $dbName" -ForegroundColor Cyan
    
    # Check if quotation_templates table exists and has template_content column
    $checkColumnQuery = "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotation_templates' AND column_name = 'template_content');"
    $hasTemplateContent = & psql -U $PGUSER -d $dbName -t -c $checkColumnQuery
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️  Error checking column, skipping..." -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    if ($hasTemplateContent.Trim() -ne 't') {
        Write-Host "  ⏭️  template_content column doesn't exist, skipping..." -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    # Check if template_data already exists
    $checkDataQuery = "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotation_templates' AND column_name = 'template_data');"
    $hasTemplateData = & psql -U $PGUSER -d $dbName -t -c $checkDataQuery
    
    if ($hasTemplateData.Trim() -eq 't') {
        Write-Host "  ⏭️  template_data already exists, skipping rename..." -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    # Rename column
    Write-Host "  Renaming template_content to template_data..." -ForegroundColor Gray
    $renameResult = & psql -U $PGUSER -d $dbName -c "ALTER TABLE public.quotation_templates RENAME COLUMN template_content TO template_data;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Column renamed successfully" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Error renaming column:" -ForegroundColor Red
        Write-Host $renameResult -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Rename Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Errors: $errorCount" -ForegroundColor Red
Write-Host "⏭️  Skipped: $skippedCount" -ForegroundColor Yellow
Write-Host ""

if ($errorCount -gt 0) {
    Write-Host "Some renames failed. Please review the errors above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "All renames completed successfully!" -ForegroundColor Green
    exit 0
}
