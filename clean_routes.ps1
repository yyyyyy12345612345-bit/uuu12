# PowerShell Script to Clean Up Conflicting Route Folders
$folders = @("daily", "library", "prayers", "video", "mushaf", "mushaf-full", "shamrely", "download")

foreach ($folder in $folders) {
    $path = "src/app/$folder"
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "Deleted: $path" -ForegroundColor Green
    } else {
        Write-Host "Not found (already deleted): $path" -ForegroundColor Yellow
    }
}

Write-Host "`nAll conflicting folders removed! Now you can run: git add . ; git commit -m 'fix 404' ; git push" -ForegroundColor Cyan
