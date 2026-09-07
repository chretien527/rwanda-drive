# 🚀 Starting Rwanda Drive Application

## Prerequisites Check ✓

Before starting, ensure you have installed:
- [x] Docker Desktop (for easiest method)
- [x] Go 1.21+ (for local backend)
- [x] Node.js 18+ (for frontend)
- [x] MongoDB (for local development without Docker)

---

## Method 1: Docker (Recommended - Easiest!) 🐳

This method starts **everything** with one command: MongoDB, Backend, and Frontend.

### Step 1: Open Terminal
Open PowerShell in your project directory:
```powershell
cd c:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive
```

### Step 2: Start All Services
```powershell
docker-compose up -d
```

This command will:
- ✅ Pull MongoDB 7.0 image (first time only)
- ✅ Build and start the backend API
- ✅ Build and start the frontend
- ✅ Create a MongoDB database named `rwanda_drive`

### Step 3: Verify Everything Started
```powershell
# Check if all containers are running
docker-compose ps
```

You should see 3 services running:
- `mongodb` on port 27017
- `api` on port 8080
- `frontend` on port 3000

### Step 4: View Logs (Optional)
```powershell
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f api

# View MongoDB logs only
docker-compose logs -f mongodb

# Press Ctrl+C to exit logs
```

### Step 5: Access the Application
- **Frontend**: Open browser to http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **MongoDB**: mongodb://localhost:27017 (use MongoDB Compass)

### Stopping Services
```powershell
# Stop all services (data persists)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

---

## Method 2: Local Development (Without Docker) 💻

Run each component separately for development with hot reload.

### Step 1: Start MongoDB

#### Option A: MongoDB as Windows Service
```powershell
# Start MongoDB service
net start MongoDB
```

#### Option B: Run MongoDB Manually
```powershell
# Create data directory (first time only)
New-Item -ItemType Directory -Force -Path "C:\data\db"

# Start MongoDB
mongod --dbpath "C:\data\db"

# Keep this terminal open
```

#### Verify MongoDB is Running
```powershell
# In a new terminal
mongosh --eval "db.runCommand({ ping: 1 })"
```

You should see: `{ ok: 1 }`

### Step 2: Start Backend API

Open a **new terminal** in your project:

```powershell
cd c:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive\backend

# Install Go dependencies (first time only)
go mod download

# Start the API server
go run cmd/api/main.go
```

You should see output like:
```
INFO Starting server on :8080
INFO Vehicle endpoints registered
INFO Admin chain endpoints registered
```

**Keep this terminal open** - the backend is now running on http://localhost:8080

### Step 3: Start Frontend

Open **another new terminal** in your project:

```powershell
cd c:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

You should see:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

**Keep this terminal open** - the frontend is now running.

### Step 4: Access the Application
- **Frontend**: Open browser to http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **MongoDB**: mongodb://localhost:27017

### Stopping Services
Press `Ctrl+C` in each terminal to stop:
1. Stop Frontend (terminal 3)
2. Stop Backend (terminal 2)
3. Stop MongoDB (terminal 1) or `net stop MongoDB`

---

## Method 3: Quick Start Script (Local Development) 📜

I've created a script that automates Method 2 for you!

### Single Command Start
```powershell
cd c:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive
.\start-local.ps1
```

This script:
- ✅ Checks if MongoDB is installed
- ✅ Starts MongoDB if not running
- ✅ Starts the Backend API
- ✅ Shows you status messages

Then manually start the frontend in a new terminal:
```powershell
npm run dev
```

---

## Verification Checklist ✅

After starting, verify everything works:

### 1. Check MongoDB Connection
```powershell
# Using mongosh
mongosh rwanda_drive --eval "db.runCommand({ ping: 1 })"

# Or using MongoDB Compass
# Connect to: mongodb://localhost:27017
# Check database: rwanda_drive
```

### 2. Check Backend API
```powershell
# Test health endpoint
curl http://localhost:8080/api/v1/health

# Or open in browser:
# http://localhost:8080/api/v1/health
```

### 3. Check Frontend
Open browser to: http://localhost:3000

You should see the Rwanda Drive application!

---

## Common Issues & Quick Fixes 🔧

### Issue 1: Port Already in Use

**MongoDB (27017):**
```powershell
# Find what's using the port
netstat -ano | findstr :27017

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

**Backend (8080):**
```powershell
# Find what's using the port
netstat -ano | findstr :8080

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

**Frontend (3000):**
```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

### Issue 2: MongoDB Connection Failed

**Check if MongoDB is running:**
```powershell
# Test connection
Test-NetConnection localhost -Port 27017
```

If it fails:
```powershell
# Start MongoDB service
net start MongoDB

# Or check Docker
docker-compose ps mongodb
docker-compose logs mongodb
```

### Issue 3: Backend Won't Start

**Check .env file exists:**
```powershell
Test-Path backend\.env
```

If `False`, create it:
```powershell
Copy-Item backend\.env.example backend\.env
```

**Check Go dependencies:**
```powershell
cd backend
go mod download
go mod verify
```

### Issue 4: Frontend Build Errors

**Clear and reinstall dependencies:**
```powershell
# Remove node_modules
Remove-Item -Recurse -Force node_modules

# Remove package lock
Remove-Item -Force package-lock.json

# Reinstall
npm install

# Try starting again
npm run dev
```

### Issue 5: Docker Issues

**Docker not running:**
```powershell
# Check Docker status
docker ps
```

If error, start Docker Desktop application.

**Containers won't start:**
```powershell
# Stop everything
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

---

## Development Tips 💡

### Hot Reload

**Frontend**: Changes auto-reload (already configured)

**Backend**: Install `air` for auto-reload:
```powershell
# Install air
go install github.com/cosmtrek/air@latest

# Run with air (in backend directory)
cd backend
air
```

### View Logs in Real-time

**Docker:**
```powershell
docker-compose logs -f
```

**Local**: Check your terminal windows where services are running

### Database Management

**View data in MongoDB Compass:**
1. Download: https://www.mongodb.com/products/compass
2. Connect: `mongodb://localhost:27017`
3. Browse `rwanda_drive` database

**Use MongoDB Shell:**
```powershell
mongosh rwanda_drive

# List collections
show collections

# Query users
db.users.find().pretty()

# Count vehicles
db.vehicles.countDocuments()
```

### Reset Database

**Docker:**
```powershell
docker-compose down -v
docker-compose up -d
```

**Local:**
```powershell
mongosh rwanda_drive --eval "db.dropDatabase()"
```

---

## Quick Reference Commands 📝

### Docker Commands
```powershell
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose ps                 # Check status
docker-compose logs -f            # View logs
docker-compose restart api        # Restart backend
docker-compose down -v            # Stop and clear data
docker-compose up -d --build      # Rebuild and start
```

### Local Development
```powershell
# Backend
cd backend
go run cmd/api/main.go

# Frontend
npm run dev

# MongoDB
net start MongoDB
net stop MongoDB
mongod --dbpath C:\data\db
```

### Checking Services
```powershell
# Check if ports are in use
netstat -ano | findstr :27017    # MongoDB
netstat -ano | findstr :8080     # Backend
netstat -ano | findstr :3000     # Frontend

# Test MongoDB connection
mongosh --eval "db.runCommand({ ping: 1 })"

# Test Backend API
curl http://localhost:8080/api/v1/health
```

---

## 🎯 Recommended Workflow

**First Time:**
1. Run `.\check-setup.ps1` to verify installation
2. Choose Docker OR Local method
3. Follow steps above
4. Access http://localhost:3000

**Daily Development:**
1. Start services (Docker: `docker-compose up -d` OR Local: `.\start-local.ps1`)
2. Start frontend: `npm run dev`
3. Code and test
4. Stop services when done

**Having Issues?**
1. Check this guide's "Common Issues" section
2. Run `.\check-setup.ps1`
3. Review logs: `docker-compose logs -f` or terminal output
4. See SETUP.md for detailed troubleshooting

---

## Next Steps 🚀

1. ✅ Start the application using one of the methods above
2. ✅ Open http://localhost:3000 in your browser
3. ✅ Check MongoDB Compass to see your database
4. ✅ Start building your features!

**Happy Coding! 🎉**
