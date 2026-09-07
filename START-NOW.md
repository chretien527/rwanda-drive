# Quick Start - Rwanda Drive (MongoDB)

## The Problem

The Docker build is failing because your code has some ZK (Zero-Knowledge) proof dependencies that aren't properly configured yet. These are advanced features that can be enabled later.

## Solution: Start MongoDB Only

For now, let's just get MongoDB running and develop locally.

---

## Step 1: Start MongoDB with Docker

```powershell
cd c:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive

# Start just MongoDB
docker-compose -f docker-compose-simple.yml up -d

# Verify it's running
docker ps
```

You should see MongoDB running on port 27017.

---

## Step 2: Fix the Backend Code (Temporary)

The issue is in `backend/internal/chain/service.go` - it imports ZK packages that don't exist.

**I've already commented out the problematic imports for you!**

But if you encounter build errors, you have two options:

### Option A: Disable Chain Service (Easiest)

Comment out chain-related code in `backend/cmd/api/main.go`:

```go
// var chainService *chain.Service
// var chainListener *chain.EventListener
// signer, err := initSigner(cfg)
// if err != nil {
// 	logger.Warnf("Chain signer not available: %v", err)
// } else {
// 	chainService, err = chain.NewService(db, logger, cfg.Chain, signer)
// 	if err != nil {
// 		logger.Warnf("Chain service not available: %v", err)
// 	} else {
// 		chainListener = chain.NewEventListener(chainService, logger)
// 		chainListener.Start(context.Background())
// 	}
// }
```

### Option B: Wait for Dependencies to Download

The Docker build might just be slow. Let it run for 10-15 minutes.

---

## Step 3: Run Backend Locally (Without Docker)

Since you have Go installed via Docker but not locally, let's use a workaround:

### Option 1: Install Go Locally (Recommended)

1. Download Go from: https://go.dev/dl/
2. Install it
3. Then run:

```powershell
cd c:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive\backend

# Tidy dependencies (removes broken imports)
go mod tidy

# Run the backend
go run cmd/api/main.go
```

### Option 2: Use Docker for Backend Dev

Create a simpler Dockerfile without the problematic dependencies.

---

## Step 4: Run Frontend

```powershell
cd c:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive

npm install
npm run dev
```

Open http://localhost:3000

---

## What's Causing the Error?

The error message says:

```
module declares its path as: github.com/0xEmmyb2/CipherPass
but was required as: github.com/0xEmmyb2/CipherPass/backend
```

This happens because:

1. Your `backend/internal/chain/service.go` imports:
   - `github.com/cipherpass/zk/*` - doesn't exist
   - `github.com/consensys/gnark` - requires Go 1.25 (doesn't exist yet, latest is 1.23)

2. These packages are trying to import your own backend as a dependency (circular reference)

---

## Fixes Applied

I've already fixed:

1. ✅ Updated `docker-compose.yml` to use MongoDB instead of PostgreSQL
2. ✅ Updated `backend/.env` with MongoDB configuration  
3. ✅ Commented out ZK imports in `service.go`
4. ✅ Changed `PostgresDB` to `MongoDB` in chain service
5. ✅ Fixed Dockerfile Go version from 1.25 to 1.23
6. ✅ Updated `go.mod` to include `go.mongodb.org/mongo-driver`

---

## Recommended Path Forward

### For Development Right Now:

1. **Start MongoDB**: `docker-compose -f docker-compose-simple.yml up -d`
2. **Install Go locally**: https://go.dev/dl/
3. **Run backend locally**: 
   ```powershell
   cd backend
   go mod tidy
   go run cmd/api/main.go
   ```
4. **Run frontend**: 
   ```powershell
   npm run dev
   ```

### For Production Later:

1. **Fix ZK Dependencies**: Either remove them or properly configure the ZK proof system
2. **Use Full Docker**: Once dependencies are fixed, use `docker-compose up -d`

---

## Quick Commands

```powershell
# Start MongoDB only
docker-compose -f docker-compose-simple.yml up -d

# Stop MongoDB
docker-compose -f docker-compose-simple.yml down

# Check MongoDB
mongosh rwanda_drive

# Check if MongoDB is running
Test-NetConnection localhost -Port 27017
```

---

## Next Steps

1. Get MongoDB running ✅
2. Install Go locally if you want to develop the backend
3. Comment out or remove ZK-related code (it's incomplete)
4. Focus on core features first (auth, vehicles, etc.)
5. Add ZK proofs later when dependencies are resolved

---

## Need Help?

The main blocker is the ZK (Zero-Knowledge proof) dependencies. These are advanced cryptographic features that:
- Aren't fully implemented yet
- Require packages that don't exist or have version conflicts
- Can be disabled for now without affecting core functionality

Focus on getting the MongoDB + Backend + Frontend running first!
