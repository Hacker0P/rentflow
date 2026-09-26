# RentFlow - One-Click Launcher for Windows PowerShell
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   RentFlow SaaS - Full Stack Launcher            " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..").FullName

# 1. Check if PostgreSQL on 5433 is running
$pgPort = Get-NetTCPConnection -LocalPort 5433 -ErrorAction SilentlyContinue
if (-not $pgPort) {
    Write-Host "[1/3] Starting PostgreSQL cluster on port 5433..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -ArgumentList "-D `"$rootDir\pgdata`"" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[1/3] PostgreSQL is already running on port 5433." -ForegroundColor Green
}

# 2. Check if Backend on 4000 is running
$apiPort = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if (-not $apiPort) {
    Write-Host "[2/3] Starting NestJS Backend on port 4000..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "dist/src/main.js" -WorkingDirectory "$rootDir\backend" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[2/3] NestJS Backend is already running on port 4000." -ForegroundColor Green
}

# 3. Check if Frontend on 3000 is running
$fePort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $fePort) {
    Write-Host "[3/3] Starting Next.js Frontend on port 3000..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run start" -WorkingDirectory "$rootDir\frontend" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[3/3] Next.js Frontend is already running on port 3000." -ForegroundColor Green
}

Write-Host "`nAll services are active!" -ForegroundColor Cyan
Write-Host "👉 Web App:  http://localhost:3000" -ForegroundColor White
Write-Host "👉 REST API: http://localhost:4000/api/v1" -ForegroundColor White
Write-Host "👉 Demo Login: rahul.sharma@example.com / Password123!" -ForegroundColor White

Start-Process "http://localhost:3000"
