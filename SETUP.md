# Rwanda Drive - MongoDB Setup Guide

This guide will help you set up and run the Rwanda Drive application with MongoDB as the database.

## Prerequisites

1. **Docker Desktop** - Install from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. **Go 1.21+** (for local backend development) - [https://go.dev/dl/](https://go.dev/dl/)
3. **Node.js 18+** (for frontend) - [https://nodejs.org/](https://nodejs.org/)
4. **MongoDB Compass** (optional, for database GUI) - [https://www.mongodb.com/products/compass](https://www.mongodb.com/products/compass)

## Option 1: Run with Docker (Recommended)

### Step 1: Start All Services

```bash
# From the project root directory
docker-compose up -d
```

This will start:
- **MongoDB** on `localhost:27017`
- **Backend API** on `localhost:8080`
- **Frontend** on `localhost:3000`

### Step 2: Verify Services

```bash
# Check if all containers are running
docker-compose ps

# Check backend logs
docker-compose logs -f api

# Check MongoDB logs
docker-compose logs -f mongodb
```

### Step 3: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **MongoDB**: mongodb://localhost:27017

### Managing Docker Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears all data)
docker-compose down -v

# Restart a specific service
docker-compose restart api

# View logs
docker-compose logs -f
```

## Option 2: Run Locally (Development)

### Step 1: Install MongoDB Locally

**Windows:**
```powershell
# Using Chocolatey
choco install mongodb

# Or download from: https://www.mongodb.com/try/download/community
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb-org

# Follow official guide: https://docs.mongodb.com/manual/installation/
```

### Step 2: Start MongoDB

**Windows:**
```powershell
# Start MongoDB as a service
net start MongoDB

# Or run manually
mongod --dbpath "C:\data\db"
```

**macOS/Linux:**
```bash
# Start MongoDB service
brew services start mongodb-community

# Or run manually
mongod --dbpath /usr/local/var/mongodb
```

### Step 3: Configure Environment

Create a `.env` file in the `backend` directory:

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Environment
ENVIRONMENT=development

# Server Configuration
SERVER_ADDRESS=:8080

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=rwanda_drive

# Secrets (change these!)
QR_SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Blockchain (for local development)
CHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
KMS_PROVIDER=local
KMS_LOCAL_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Logging
LOG_LEVEL=info
```

### Step 4: Run Backend

```bash
cd backend

# Install Go dependencies
go mod download

# Run the API server
go run cmd/api/main.go
```

The backend will:
1. Connect to MongoDB at `mongodb://localhost:27017`
2. Create the `rwanda_drive` database if it doesn't exist
3. Create indexes automatically
4. Start the API server on port 8080

### Step 5: Run Frontend

Open a new terminal:

```bash
# Install dependencies (if not already done)
npm install

# Run the development server
npm run dev
```

## MongoDB Database Structure

The application automatically creates these collections:

- **users** - User accounts and profiles
- **refresh_tokens** - JWT refresh tokens
- **email_verifications** - Email verification tokens
- **password_resets** - Password reset tokens
- **phone_otps** - Phone OTP codes
- **invite_tokens** - User invitation tokens
- **vehicles** - Vehicle registrations
- **qr_active_tokens** - Active QR credentials
- **license_leaves** - Blockchain license leaves
- **shadow_merkle_nodes** - Merkle tree nodes
- **shadow_merkle_state** - Merkle tree state

## Accessing MongoDB

### Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Browse the `rwanda_drive` database

### Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Switch to the database
use rwanda_drive

# List collections
show collections

# Query users
db.users.find()

# Count documents
db.vehicles.countDocuments()
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "Failed to connect to database"**

1. Check if MongoDB is running:
   ```bash
   # Docker
   docker-compose ps mongodb
   
   # Local
   mongosh --eval "db.runCommand({ ping: 1 })"
   ```

2. Verify the connection string in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   ```

3. Check MongoDB logs:
   ```bash
   # Docker
   docker-compose logs mongodb
   
   # Local (Windows)
   Get-EventLog -LogName Application -Source MongoDB
   ```

### Port Already in Use

**Error: "Port 27017 already in use"**

```bash
# Find process using the port
netstat -ano | findstr :27017

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
ports:
  - "27018:27017"  # Map to different host port
```

### Clear All Data

```bash
# Docker - removes all data
docker-compose down -v

# Local - drop the database
mongosh rwanda_drive --eval "db.dropDatabase()"
```

## Data Backup and Restore

### Backup

```bash
# Backup entire database
mongodump --db=rwanda_drive --out=./backup

# Backup specific collection
mongodump --db=rwanda_drive --collection=users --out=./backup
```

### Restore

```bash
# Restore database
mongorestore --db=rwanda_drive ./backup/rwanda_drive

# Restore specific collection
mongorestore --db=rwanda_drive --collection=users ./backup/rwanda_drive/users.bson
```

## Development Tips

1. **Hot Reload**: Use `air` for Go hot reload:
   ```bash
   go install github.com/cosmtrek/air@latest
   cd backend
   air
   ```

2. **View API Logs**: Backend logs show all database queries in development mode

3. **Database Indexes**: Indexes are created automatically on startup. Check `backend/pkg/database/mongo.go`

4. **Test Data**: Run `backend/cmd/bootstrap/main.go` to seed test data (if available)

## Production Considerations

1. **Use Authentication**: Add MongoDB authentication in production
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017/?authSource=admin
   ```

2. **Enable TLS**: Use encrypted connections
   ```env
   MONGODB_URI=mongodb://localhost:27017/?tls=true
   ```

3. **Change Secrets**: Update `QR_SECRET_KEY` and `JWT_SECRET` with strong random values

4. **Use MongoDB Atlas**: Consider managed MongoDB for production
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rwanda_drive?retryWrites=true&w=majority
   ```

5. **Backup Strategy**: Set up automated backups

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Go Driver](https://pkg.go.dev/go.mongodb.org/mongo-driver/mongo)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
