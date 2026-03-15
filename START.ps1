# Lost & Found ??? One-Click Startup Script
# Run this file with: Right-click ??? "Run with PowerShell"
Write-Host "???? Starting Lost & Found Platform..." -ForegroundColor Cyan
# Kill any old node processes on port 5000
$existing = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "??? Killing old server on port 5000..." -ForegroundColor Yellow
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
# Start Backend
Write-Host "???? Starting Backend (port 5000)..." -ForegroundColor Green
$serverPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; node index.js" -WindowStyle Normal
Start-Sleep -Seconds 3
# Start Frontend  
Write-Host "???? Starting Frontend (port 5173)..." -ForegroundColor Magenta
$clientPath = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$clientPath'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host ""
Write-Host "??? Both servers started!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login: aakshna122005@gmail.com / password123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to open the app in browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:5173"


