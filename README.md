# Rwanda Drive - Full Stack Application

This is a full-stack application for Rwanda's digital driving credentials platform, featuring a Go backend and Next.js frontend.

## Project Structure

```
.
├── backend/                     # Go backend service
│   ├── cmd/api/main.go          # Application entry point
│   ├── internal/                # Private application logic
│   │   ├── auth/                # Authentication service
│   │   ├── chain/               # Blockchain operations
│   │   ├── config/              # Configuration and logging
│   │   ├── qrcredentials/       # QR code handling
│   │   ├── server/              # HTTP server setup
│   │   └── vehicle/             # Vehicle management (new)
│   ├── pkg/                     # Public libraries
│   │   └── database/            # Database abstraction
│   ├── migrations/              # Database migrations
│   ├── contracts/               # Smart contracts (Solidity)
│   └── go.mod                   # Go module definition
├── src/                         # Next.js frontend
│   ├── app/                     # App router pages
│   ├── components/              # React components
│   └── lib/                     # Utilities and types
├── public/                      # Static assets
└── ...
```

## Getting Started

### Prerequisites

- Go 1.22 or later
- Node.js 18+ and npm/yarn/pnpm/bun
- PostgreSQL 12 or later
- [golang-migrate](https://github.com/golang-migrate/migrate) (for migrations)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and adjust values as needed (see backend/.env.example if exists)
3. Install Go dependencies:
   ```bash
   cd backend
   go mod download
   ```
4. Install frontend dependencies:
   ```bash
   cd ../
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```
5. Set up the database:
   ```bash
   # Create the database
   createdb cipherpass
   
   # Run migrations
   migrate -path ./backend/migrations -database "postgres://postgres:postgres@localhost:5432/cipherpass?sslmode=disable" up
   ```
6. Start the development servers:
   ```bash
   # In one terminal - start backend
   cd backend
   go run ./cmd/api
   
   # In another terminal - start frontend
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

### API Endpoints

- `GET /healthz` - Health check endpoint
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/qr/refresh` - Refresh QR token (Driver only)
- `POST /api/v1/verification/scan` - Verify QR token (Officer/Admin only)
- `POST /api/v1/vehicles` - Add new vehicle (Driver only)
- `GET /api/v1/vehicles` - Get user's vehicles (Driver only)
- `/api/v1/auth/*` - Other auth endpoints (MFA, password reset, etc.)

### Configuration

Configuration is loaded from environment variables. See backend/.env.example for all available options.

#### Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment (development/staging/production) | `development` |
| `SERVER_ADDRESS` | HTTP server address | `:8080` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | PostgreSQL database name | `cipherpass` |
| `LOG_LEVEL` | Log level (debug/info/warn/error/fatal) | `info` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:8080` |

## Development

### Running Tests

Backend:
```bash
cd backend
go test ./...
```

Frontend:
```bash
npm test
# or
yarn test
# or
pnpm test
# or
bun test
```

### Linting

Backend:
```bash
cd backend
golangci-lint run
```

Frontend:
```bash
npm run lint
# or
yarn lint
# or
pnpm lint
# or
bun run lint
```

## Features

- **Authentication**: Secure JWT-based auth with optional MFA
- **QR Credentials**: Dynamic, rotating QR codes for secure verification
- **Blockchain Integration**: On-chain verification of licenses and credentials
- **Vehicle Management**: Register and link vehicles to digital wallet
- **Role-Based Access**: Driver, Officer, Admin, and Super Admin roles
- **Real-time Verification**: Instant police verification via QR scanning
- **Offline Support**: Cached credentials for use without connectivity

## Database Migrations

We use [golang-migrate](https://github.com/golang-migrate/migrate) for managing database migrations.

To create a new migration:
```bash
migrate create -ext sql -dir ./backend/migrations -seq add_some_feature
```

This will create two files:
- `xxxxxx_add_some_feature.up.sql`
- `xxxxxx_add_some_feature.down.sql`

## Deployment

### Backend (Go)
The backend can be deployed anywhere that supports Go applications:
- Docker containers
- Traditional VMs
- Cloud platforms (AWS, GCP, Azure, etc.)

### Frontend (Next.js)
The frontend can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Traditional hosting with Node.js support

## License

MIT
