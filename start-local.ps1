# Rwanda Drive - Local Development Startup Script
# This script starts MongoDB and the backend API

Write-Host "🚀 Starting Rwanda Drive Local Development Environment" -ForegroundColor Green
Write-Host ""

# Check if MongoDB is installed
$mongoInstalled = Get-Command mongod -ErrorAction SilentlyContinue

if (-not $mongoInstalled) {
    Write-Host "❌ MongoDB is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MongoDB:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host "  2. Or use Chocolatey: choco install mongodb" -ForegroundColor Yellow
    Write-Host "  3. Or use Docker: docker-compose up -d mongodb" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if MongoDB is running
$mongoRunning = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $mongoRunning) {
    Write-Host "📦 Starting MongoDB..." -ForegroundColor Cyan
    
    # Create data directory if it doesn't exist
    $dataPath = "$env:USERPROFILE\mongodb-data"
    if (-not (Test-Path $dataPath)) {
        New-Item -ItemType Directory -Path $dataPath | Out-Null
    }
    
    # Start MongoDB in background
    Start-Process -FilePath "mongod" -ArgumentList "--dbpath `"$dataPath`"" -WindowStyle Hidden
    
    # Wait for MongoDB to start
    Write-Host "⏳ Waiting for MongoDB to start..." -ForegroundColor Yellow
    $retries = 0
    while ($retries -lt 10) {
        Start-Sleep -Seconds 1
        $mongoRunning = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($mongoRunning) {
            break
        }
        $retries++
    }
    
    if ($mongoRunning) {
        Write-Host "✅ MongoDB started successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start MongoDB" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ MongoDB is already running" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Starting Backend API..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

# Start backend
Set-Location backend
go run cmd/api/main.go
