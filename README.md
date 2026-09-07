# Rwanda Drive

Rwanda Drive is a full-stack digital driving credentials platform with three local services:

| Service | Port | Purpose |
| --- | ---: | --- |
| MongoDB | `27017` | Application database |
| Go API | `8080` | Backend HTTP API |
| Next.js | `3000` | Web frontend |

## Prerequisites

Install the following before starting:

- Docker Desktop, for the easiest setup
- Go 1.23 or later, for running the API locally
- Node.js 18 or later and npm, for running the frontend locally

The commands below use PowerShell on Windows. Bash users can use the same commands after changing the directory path format.

## Option 1: Run Each Service in Its Own Terminal

Open three terminal windows. From the repository root, run the following commands.

### Terminal 1: MongoDB

```powershell
cd C:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive
docker compose -f docker-compose-simple.yml up -d
docker compose -f docker-compose-simple.yml ps
```

This starts MongoDB on `mongodb://localhost:27017` and keeps it running in the background.

### Terminal 2: Go API

```powershell
cd C:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive\backend
go mod download
go run .\cmd\api
```

The API starts on `http://localhost:8080`. Keep this terminal open. Stop it with `Ctrl+C`.

Before the first run, ensure `backend\.env` exists. To create a local configuration from the template:

```powershell
cd C:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive
Copy-Item backend\.env.example backend\.env
```

The template uses the local MongoDB container. If `backend\.env` already exists, check that it has:

```text
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=rwanda_drive
```

### Terminal 3: Next.js Frontend

```powershell
cd C:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive
npm install
$env:NEXT_PUBLIC_API_URL = "http://localhost:8080/api/v1"
npm run dev
```

Open the application at <http://localhost:3000>.

## Option 2: Start All Three with Docker Compose

From the repository root:

```powershell
cd C:\Users\Chris\Desktop\Projects\rwanda-drive\rwanda-drive
docker compose up -d --build
docker compose ps
```

Open <http://localhost:3000>. View all service logs with:

```powershell
docker compose logs -f
```

View one service only:

```powershell
docker compose logs -f mongodb
docker compose logs -f api
docker compose logs -f frontend
```

## Stop Services

For the manual setup, press `Ctrl+C` in the API and frontend terminals, then stop MongoDB:

```powershell
docker compose -f docker-compose-simple.yml down
```

For the Docker Compose setup:

```powershell
docker compose down
```

To stop and remove the MongoDB data volume as well:

```powershell
docker compose down -v
```

## Verify the Services

```powershell
Test-NetConnection localhost -Port 27017
Test-NetConnection localhost -Port 8080
Test-NetConnection localhost -Port 3000
```

The API health endpoint is available at <http://localhost:8080/healthz>.

## Development Commands

Run backend tests:

```powershell
cd backend
go test ./...
```

Run frontend linting:

```powershell
npm run lint
```

## Repository Layout

- `backend/` - Go API and MongoDB integration
- `src/` - Next.js application and React components
- `public/` - Static frontend assets
- `contracts/` - Solidity smart contracts
- `zk/` - Zero-knowledge proof components
