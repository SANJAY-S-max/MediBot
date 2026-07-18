# MediBot Public Launcher - Cloudflare Tunnel (No Account Needed)
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MediBot Public URL Launcher" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$cfPath = "$env:TEMP\cloudflared.exe"
if (-not (Test-Path $cfPath)) {
    Write-Host "[1/4] Downloading Cloudflare Tunnel..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cfPath -UseBasicParsing
    Write-Host "      Done!" -ForegroundColor Green
} else {
    Write-Host "[1/4] cloudflared already downloaded." -ForegroundColor Green
}

Write-Host "[2/4] Starting Backend (FastAPI port 8000)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 2>&1
} -ArgumentList "$PSScriptRoot\backend"
Start-Sleep -Seconds 5
Write-Host "      Backend ready!" -ForegroundColor Green

Write-Host "[3/4] Starting Frontend (Vite port 5173)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList "$PSScriptRoot\frontend"
Start-Sleep -Seconds 8
Write-Host "      Frontend ready!" -ForegroundColor Green

Write-Host "[4/4] Creating public HTTPS tunnel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  YOUR PUBLIC URL WILL APPEAR BELOW:" -ForegroundColor Magenta
Write-Host "  Look for: https://xxxx.trycloudflare.com" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

& $cfPath tunnel --url http://localhost:5173 2>&1

Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
Write-Host "All stopped. Goodbye!" -ForegroundColor Green
