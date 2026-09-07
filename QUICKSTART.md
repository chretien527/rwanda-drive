# Quick Start Guide

## 🚀 Fastest Way to Run (Docker)

```powershell
# Start everything with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

Access:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **MongoDB**: mongodb://localhost:27017

---

## 🛠️ Local Development (Without Docker)

### 1. Install MongoDB

**Windows (Chocolatey):**
```powershell
choco install mongodb
```

**Or download**: https://www.mongodb.com/try/download/community

### 2. Start MongoDB

```powershell
# Option 1: Start as Windows Service
net start MongoDB

# Option 2: Run manually
mongod --dbpath "C:\data\db"

# Option 3: Use the startup script
.\start-local.ps1
```

### 3. Run Backend

```powershell
cd backend
go run cmd/api/main.go
```

### 4. Run Frontend (in new terminal)

```powershell
npm install
npm run dev
```

---

## 📊 Access MongoDB

### MongoDB Compass (GUI)
1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Open database: `rwanda_drive`

### MongoDB Shell
```bash
mongosh
use rwanda_drive
db.users.find()
```

---

## 🔧 Configuration

Edit `backend/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=rwanda_drive

# Server
SERVER_ADDRESS=:8080

# Secrets (CHANGE THESE!)
QR_SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

---

## 🐛 Troubleshooting

### MongoDB not connecting?
```powershell
# Check if MongoDB is running
Test-NetConnection localhost -Port 27017

# Check Docker containers
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb
```

### Port 27017 already in use?
```powershell
# Find process
netstat -ano | findstr :27017

# Kill process
taskkill /PID <PID> /F
```

### Clear all data?
```powershell
# Docker
docker-compose down -v

# Local
mongosh rwanda_drive --eval "db.dropDatabase()"
```

---

## 📚 Full Documentation

See [SETUP.md](./SETUP.md) for detailed setup instructions and production considerations.
