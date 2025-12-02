# PowerShell script to replace all supabase references with db
# Run this from the project root: .\replace-supabase.ps1

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace supabase with db (only when used as a variable/object, not in comments or strings)
    # Pattern: await supabase, const { data } = await supabase, etc.
    $content = $content -replace '\bsupabase\b', 'db'
    
    # Remove supabase imports
    $content = $content -replace "import\s*\{\s*supabase\s*\}\s*from\s*['""]@/integrations/supabase/client['""];?\s*", ""
    $content = $content -replace "import\s*supabase\s*from\s*['""]@/integrations/supabase/client['""];?\s*", ""
    
    # Ensure db is imported if supabase was being used
    if ($originalContent -match '\bsupabase\b' -and $content -notmatch "from\s*['""]@/lib/database['""]") {
        # Check if file already has imports
        if ($content -match '^import\s+') {
            # Add db import after the first import statement
            $content = $content -replace '(^import[^\n]*\n)', "`$1import { db } from '@/lib/database';`n"
        } else {
            # Add at the beginning of the file
            $content = "import { db } from '@/lib/database';`n" + $content
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nReplacement complete! Please review the changes before committing."

