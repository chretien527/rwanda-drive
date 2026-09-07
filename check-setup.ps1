# Rwanda Drive - Setup Checker
# Verifies that all dependencies and services are ready

Write-Host "🔍 Rwanda Drive - Setup Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check MongoDB
Write-Host "📦 Checking MongoDB..." -ForegroundColor Yellow
$mongoInstalled = Get-Command mongod -ErrorAction SilentlyContinue
if ($mongoInstalled) {
    Write-Host "  ✅ MongoDB is installed: $($mongoInstalled.Source)" -ForegroundColor Green
    
    $mongoRunning = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($mongoRunning) {
        Write-Host "  ✅ MongoDB is running on port 27017" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  MongoDB is not running" -ForegroundColor Yellow
        Write-Host "     Start with: net start MongoDB" -ForegroundColor Gray
        Write-Host "     Or run: mongod --dbpath C:\data\db" -ForegroundColor Gray
        $allGood = $false
    }
} else {
    Write-Host "  ❌ MongoDB is not installed" -ForegroundColor Red
    Write-Host "     Install: choco install mongodb" -ForegroundColor Gray
    Write-Host "     Or download: https://www.mongodb.com/try/download/community" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# Check Go
Write-Host "🔧 Checking Go..." -ForegroundColor Yellow
$goInstalled = Get-Command go -ErrorAction SilentlyContinue
if ($goInstalled) {
    $goVersion = & go version
    Write-Host "  ✅ Go is installed: $goVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Go is not installed" -ForegroundColor Red
    Write-Host "     Download: https://go.dev/dl/" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# Check Node.js
Write-Host "🟢 Checking Node.js..." -ForegroundColor Yellow
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if ($nodeInstalled) {
    $nodeVersion = & node --version
    Write-Host "  ✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "     Download: https://nodejs.org/" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# Check Docker (optional)
Write-Host "🐳 Checking Docker (optional)..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    $dockerVersion = & docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Docker is installed: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker is running
        $dockerRunning = & docker ps 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Docker daemon is running" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Docker daemon is not running" -ForegroundColor Yellow
            Write-Host "     Start Docker Desktop" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  Docker is installed but not accessible" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ️  Docker is not installed (optional for local dev)" -ForegroundColor Gray
    Write-Host "     Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
}

Write-Host ""

# Check .env file
Write-Host "📄 Checking configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "  ✅ backend\.env file exists" -ForegroundColor Green
    
    # Check for required vars
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match "MONGODB_URI") {
        Write-Host "  ✅ MONGODB_URI is configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  MONGODB_URI not found in .env" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "  ⚠️  backend\.env file not found" -ForegroundColor Yellow
    Write-Host "     Copy from: backend\.env.example" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# Check node_modules
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "     Run: npm install" -ForegroundColor Gray
    $allGood = $false
}

if (Test-Path "backend\go.mod") {
    Write-Host "  ✅ Backend go.mod found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Backend go.mod not found" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "All checks passed! You're ready to go!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the app:" -ForegroundColor Cyan
    Write-Host "  Option 1 (Docker):  docker-compose up -d" -ForegroundColor White
    Write-Host "  Option 2 (Local):   .\start-local.ps1" -ForegroundColor White
    Write-Host "  Option 3 (Manual):  See QUICKSTART.md" -ForegroundColor White
} else {
    Write-Host "Some issues need attention. See messages above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For help, see:" -ForegroundColor Cyan
    Write-Host "  - QUICKSTART.md for quick setup" -ForegroundColor White
    Write-Host "  - SETUP.md for detailed instructions" -ForegroundColor White
}

Write-Host ""
