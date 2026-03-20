Set-Location "D:\GitHub\Tech_Revisor_Automation_Suite\Odoo_Project\backend\src\models"
$fixed = 0
$files = Get-ChildItem -Recurse -Filter "*.ts"

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $changed = $false
    
    # Check if file has companyID field with sparse:true AND schema.index({ companyID: 1 }) without sparse
    $hasSparseField = $content -match 'companyID\s*:\s*\{[^}]*sparse\s*:\s*true'
    $hasSchemaIndex = $content -match '\.index\(\{\s*companyID\s*:\s*1\s*\}\s*\)'
    
    if ($hasSparseField -and $hasSchemaIndex) {
        # Remove the "sparse: true," line from companyID field definition
        # Pattern: line containing only "sparse: true," with optional comment
        $content = $content -replace '(\s+)(sparse\s*:\s*true\s*,?\s*)(\/\/[^\r\n]*)?\r?\n(\s+)(\/\/[^\r\n]*)?\r?\n(?=\s+\})', '$1$4'
        $content = $content -replace '(\s+sparse\s*:\s*true\s*,?\s*\/\/[^\r\n]*\r?\n)', ''
        $content = $content -replace '(\s+sparse\s*:\s*true\s*,\s*\r?\n)', ''
        $content = $content -replace '(\s+sparse\s*:\s*true\s*\r?\n)', ''
        
        # Update schema.index({ companyID: 1 }) to schema.index({ companyID: 1 }, { sparse: true })
        $content = $content -replace '(\.index\(\{\s*companyID\s*:\s*1\s*\})\s*\)', '$1, { sparse: true })'
        
        $changed = $true
    }
    
    if ($changed) {
        Set-Content -Path $f.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($f.Name)"
        $fixed++
    }
}

Write-Host ""
Write-Host "Total fixed: $fixed files"
