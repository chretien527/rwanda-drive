# Rwanda Drive - MongoDB Configuration

## ✅ What's Been Configured

Your Rwanda Drive application is now fully configured to use **MongoDB** for local data storage:

### Files Updated:
1. ✅ **docker-compose.yml** - Switched from PostgreSQL to MongoDB
2. ✅ **backend/.env.example** - Updated with MongoDB configuration
3. ✅ **backend/.env** - Created with MongoDB settings

### New Files Created:
- 📄 **SETUP.md** - Comprehensive setup guide
- 📄 **QUICKSTART.md** - Quick reference guide
- 📄 **check-setup.ps1** - Verification script
- 📄 **start-local.ps1** - Local development startup script

---

## 🚀 How to Run

### Option 1: Docker (Easiest)

```powershell
# Start all services (MongoDB + Backend + Frontend)
docker-compose up -d

# Check status
docker-compose ps

# Stop services
docker-compose down
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- MongoDB: mongodb://localhost:27017 (Database: `rwanda_drive`)

### Option 2: Local Development

```powershell
# 1. Check your setup
.\check-setup.ps1

# 2. Start MongoDB and Backend
.\start-local.ps1

# 3. In a new terminal, start Frontend
npm install
npm run dev
```

---

## 📊 MongoDB Connection Details

Your app connects to MongoDB with these settings:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=rwanda_drive
```

### Collections Created Automatically:
- `users` - User accounts
- `vehicles` - Vehicle registrations
- `refresh_tokens` - JWT tokens
- `email_verifications` - Email verification
- `password_resets` - Password reset tokens
- `phone_otps` - OTP codes
- `invite_tokens` - User invitations
- `qr_active_tokens` - QR credentials
- `license_leaves` - Blockchain data
- `shadow_merkle_nodes` - Merkle tree
- `shadow_merkle_state` - Merkle state

---

## 🔍 Viewing Your Data

### MongoDB Compass (Recommended GUI)
1. Download: https://www.mongodb.com/products/compass
2. Connect: `mongodb://localhost:27017`
3. Select database: `rwanda_drive`

### MongoDB Shell
```bash
# Connect
mongosh

# Use database
use rwanda_drive

# List collections
show collections

# Query data
db.users.find().pretty()
db.vehicles.countDocuments()
```

---

## 🛠️ Development Workflow

### Starting Development:
```powershell
# Check if everything is ready
.\check-setup.ps1

# Start with Docker
docker-compose up -d

# OR start locally
.\start-local.ps1
```

### Making Changes:
- Backend code: Changes require restart (`Ctrl+C` and rerun)
- Frontend code: Hot reload is automatic
- Database: No restart needed

### Viewing Logs:
```powershell
# Docker logs
docker-compose logs -f api
docker-compose logs -f mongodb

# Local: Check terminal output
```

---

## 🐛 Common Issues & Solutions

### MongoDB Won't Start
```powershell
# Check if port 27017 is in use
netstat -ano | findstr :27017

# Kill process if needed
taskkill /PID <PID> /F

# Start MongoDB
net start MongoDB
```

### Backend Can't Connect
1. Verify MongoDB is running: `Test-NetConnection localhost -Port 27017`
2. Check `backend/.env` has correct URI
3. View backend logs for error details

### Clear All Data
```powershell
# Docker (removes volumes)
docker-compose down -v

# Local (drop database)
mongosh rwanda_drive --eval "db.dropDatabase()"
```

---

## 📚 Additional Resources

- **Full Setup Guide**: See [SETUP.md](./SETUP.md)
- **Quick Reference**: See [QUICKSTART.md](./QUICKSTART.md)
- **MongoDB Docs**: https://docs.mongodb.com/
- **Go MongoDB Driver**: https://pkg.go.dev/go.mongodb.org/mongo-driver

---

## 🔐 Security Notes

### Development (Current Setup):
- MongoDB has **no authentication** (local development only)
- Secrets use **default values** (not secure)

### For Production:
1. Enable MongoDB authentication:
   ```env
   MONGODB_URI=mongodb://username:password@host:27017/?authSource=admin
   ```

2. Use strong secrets in `.env`:
   ```env
   QR_SECRET_KEY=<generate-strong-random-string>
   JWT_SECRET=<generate-strong-random-string>
   ```

3. Consider MongoDB Atlas (managed service):
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rwanda_drive
   ```

4. Enable TLS/SSL encryption

---

## 💡 Tips

1. **Hot Reload for Go**: Install `air` for automatic backend reload
   ```bash
   go install github.com/cosmtrek/air@latest
   cd backend
   air
   ```

2. **Database Backups**:
   ```bash
   # Backup
   mongodump --db=rwanda_drive --out=./backup

   # Restore
   mongorestore --db=rwanda_drive ./backup/rwanda_drive
   ```

3. **Performance**: MongoDB indexes are created automatically by the app

4. **Testing**: All database operations are logged in development mode

---

## 📞 Need Help?

1. Run `.\check-setup.ps1` to diagnose issues
2. Check logs: `docker-compose logs -f` or terminal output
3. Review [SETUP.md](./SETUP.md) for detailed troubleshooting
4. Verify MongoDB connection: `mongosh` then `db.runCommand({ ping: 1 })`

---

**Everything is configured and ready to use MongoDB! 🎉**
