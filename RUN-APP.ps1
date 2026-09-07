# Rwanda Drive - Quick Start Script
# This script helps you start the application easily

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Rwanda Drive - Application Starter" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerAvailable) {
    Write-Host "[1] Start with Docker (Recommended)" -ForegroundColor Green
    Write-Host "    - Starts MongoDB, Backend, and Frontend" -ForegroundColor Gray
    Write-Host "    - Everything in containers" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "[!] Docker not found" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "[2] Start MongoDB Only (Local Dev)" -ForegroundColor Yellow
Write-Host "    - For manual backend/frontend development" -ForegroundColor Gray
Write-Host ""

Write-Host "[3] Check Status" -ForegroundColor Cyan
Write-Host "    - See what's currently running" -ForegroundColor Gray
Write-Host ""

Write-Host "[4] Stop All Services" -ForegroundColor Red
Write-Host "    - Stop Docker containers" -ForegroundColor Gray
Write-Host ""

Write-Host "[Q] Quit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select an option"

switch ($choice) {
    "1" {
        if (-not $dockerAvailable) {
            Write-Host ""
            Write-Host "ERROR: Docker is not installed!" -ForegroundColor Red
            Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
            Write-Host ""
            exit 1
        }
        
        Write-Host ""
        Write-Host "Starting all services with Docker..." -ForegroundColor Cyan
        docker-compose up -d
        
        Write-Host ""
        Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        Write-Host ""
        docker-compose ps
        
        Write-Host ""
        Write-Host "======================================" -ForegroundColor Green
        Write-Host "   Application Started Successfully!" -ForegroundColor Green
        Write-Host "======================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your application:" -ForegroundColor Cyan
        Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend:   http://localhost:8080" -ForegroundColor White
        Write-Host "  MongoDB:   mongodb://localhost:27017" -ForegroundColor White
        Write-Host ""
        Write-Host "View logs:" -ForegroundColor Cyan
        Write-Host "  docker-compose logs -f" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Stop services:" -ForegroundColor Cyan
        Write-Host "  docker-compose down" -ForegroundColor Gray
        Write-Host ""
    }
    
    "2" {
        $mongoInstalled = Get-Command mongod -ErrorAction SilentlyContinue
        
        if (-not $mongoInstalled) {
            Write-Host ""
            Write-Host "ERROR: MongoDB is not installed!" -ForegroundColor Red
            Write-Host "Options:" -ForegroundColor Yellow
            Write-Host "  1. Use Docker instead (option 1)" -ForegroundColor Gray
            Write-Host "  2. Install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Gray
            Write-Host ""
            exit 1
        }
        
        Write-Host ""
        Write-Host "Starting MongoDB only..." -ForegroundColor Cyan
        
        if ($dockerAvailable) {
            docker-compose up -d mongodb
            Write-Host "MongoDB started in Docker on port 27017" -ForegroundColor Green
        } else {
            Write-Host "Starting MongoDB locally..." -ForegroundColor Cyan
            Start-Process -FilePath "mongod" -ArgumentList "--dbpath `"$env:USERPROFILE\mongodb-data`"" -WindowStyle Normal
            Write-Host "MongoDB started locally" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Now you can start backend and frontend manually:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Backend:" -ForegroundColor Yellow
        Write-Host "  cd backend" -ForegroundColor Gray
        Write-Host "  go run cmd/api/main.go" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Frontend (new terminal):" -ForegroundColor Yellow
        Write-Host "  npm run dev" -ForegroundColor Gray
        Write-Host ""
    }
    
    "3" {
        Write-Host ""
        Write-Host "Checking service status..." -ForegroundColor Cyan
        Write-Host ""
        
        if ($dockerAvailable) {
            Write-Host "Docker Containers:" -ForegroundColor Yellow
            docker-compose ps
        }
        
        Write-Host ""
        Write-Host "Port Status:" -ForegroundColor Yellow
        
        $mongo = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
        $backend = Test-NetConnection -ComputerName localhost -Port 8080 -InformationLevel Quiet -WarningAction SilentlyContinue
        $frontend = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
        
        Write-Host "  MongoDB (27017):  $(if($mongo){'Running'}else{'Not running'})" -ForegroundColor $(if($mongo){'Green'}else{'Red'})
        Write-Host "  Backend (8080):   $(if($backend){'Running'}else{'Not running'})" -ForegroundColor $(if($backend){'Green'}else{'Red'})
        Write-Host "  Frontend (3000):  $(if($frontend){'Running'}else{'Not running'})" -ForegroundColor $(if($frontend){'Green'}else{'Red'})
        Write-Host ""
    }
    
    "4" {
        Write-Host ""
        Write-Host "Stopping all services..." -ForegroundColor Red
        
        if ($dockerAvailable) {
            docker-compose down
            Write-Host "Docker services stopped" -ForegroundColor Yellow
        } else {
            Write-Host "No Docker found. Stop services manually with Ctrl+C" -ForegroundColor Yellow
        }
        
        Write-Host ""
    }
    
    "Q" {
        Write-Host ""
        Write-Host "Goodbye!" -ForegroundColor Cyan
        Write-Host ""
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "Invalid option. Please try again." -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
