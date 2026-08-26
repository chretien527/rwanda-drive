# Ikizere - Web2 Go Backend

This is the Web2 Go backend for the Ikizere platform, implementing the foundation as specified in the consolidated master document.

## Project Structure

```
backend/
├── cmd/api/main.go           # Application entry point
├── internal/                 # Private application logic
│   ├── config/               # Configuration and logging
│   ├── auth/                 # Authentication service
│   ├── server/               # HTTP server setup
│   └── ...                   # Other internal packages
├── pkg/                      # Public libraries
│   └── database/             # Database abstraction
├── migrations/               # Database migrations
├── contracts/                # Smart contracts (Solidity)
├── zk/                       # Zero-knowledge proofs
└── go.mod                    # Go module definition
```

## Getting Started

### Prerequisites

- Go 1.22 or later
- PostgreSQL 12 or later
- [golang-migrate](https://github.com/golang-migrate/migrate) (for migrations)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and adjust values as needed
3. Install Go dependencies:
   ```bash
   go mod download
   ```
4. Set up the database:
   ```bash
   # Create the database
   createdb cipherpass
   
   # Run migrations
   migrate -path ./migrations -database "postgres://postgres:postgres@localhost:5432/cipherpass?sslmode=disable" up
   ```
5. Run the application:
   ```bash
   go run ./cmd/api
   ```

### API Endpoints

- `GET /healthz` - Health check endpoint

### Configuration

Configuration is loaded from environment variables. See `.env.example` for all available options.

### Database Migrations

We use [golang-migrate](https://github.com/golang-migrate/migrate) for managing database migrations.

To create a new migration:
```bash
migrate create -ext sql -dir ./migrations -seq add_some_feature
```

This will create two files:
- `xxxxxx_add_some_feature.up.sql`
- `xxxxxx_add_some_feature.down.sql`

### Environment Variables

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

## Development

### Running Tests

```bash
go test ./...
```

### Linting

```bash
golangci-lint run
```

## License

MIT