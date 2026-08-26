package config

import (
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"github.com/stretchr/testify/require"
)

// TestLoadDefaultConfig verifies that config loads with default values when no env vars are set
func TestLoadDefaultConfig(t *testing.T) {
	// Clear relevant environment variables
	cleanEnv := []string{
		"ENVIRONMENT", "SERVER_ADDRESS", "SERVER_READ_TIMEOUT", "SERVER_WRITE_TIMEOUT",
		"SERVER_IDLE_TIMEOUT", "SERVER_MAX_HEADER_BYTES", "DB_HOST", "DB_PORT", "DB_USER",
		"DB_PASSWORD", "DB_NAME", "DB_SSL_MODE", "DB_POOL_MAX", "DB_POOL_MIN", "LOG_LEVEL",
		"QR_SECRET_KEY", "JWT_SECRET", "CHAIN_RPC_URL", "CHAIN_ID",
		"LICENSE_REGISTRY_ADDR", "CREDENTIAL_REGISTRY_ADDR", "AUDIT_ANCHOR_ADDR",
		"KMS_PROVIDER", "KMS_KEY_ID", "KMS_REGION",
	}
	for _, key := range cleanEnv {
		os.Unsetenv(key)
	}

	_ = godotenv.Unset()

	cfg, err := Load()
	require.NoError(t, err)

	// Check server defaults
	require.Equal(t, Development, cfg.Environment)
	require.Equal(t, ":8080", cfg.Server.Address)
	require.Equal(t, time.Second*15, cfg.Server.ReadTimeout)
	require.Equal(t, time.Second*15, cfg.Server.WriteTimeout)
	require.Equal(t, time.Second*60, cfg.Server.IdleTimeout)
	require.Equal(t, 1048576, cfg.Server.MaxHeaderBytes)

	// Check database defaults
	require.Equal(t, "localhost", cfg.Database.Host)
	require.Equal(t, "5432", cfg.Database.Port)
	require.Equal(t, "postgres", cfg.Database.User)
	require.Equal(t, "postgres", cfg.Database.Password)
	require.Equal(t, "cipherpass", cfg.Database.DBName)
	require.Equal(t, "disable", cfg.Database.SSLMode)
	require.Equal(t, 25, cfg.Database.PoolMax)
	require.Equal(t, 2, cfg.Database.PoolMin)

	// Check chain defaults
	require.NotNil(t, cfg.Chain.ChainID)
	require.Equal(t, "http://127.0.0.1:8545", cfg.Chain.RPCURL)
	require.Equal(t, "local", cfg.Chain.KMS.Provider)
	require.Equal(t, uint64(1), cfg.Chain.BlockConfirmations)

	require.Equal(t, "info", cfg.LogLevel)
}

// TestLoadCustomConfig verifies that config loads custom values from environment variables
func TestLoadCustomConfig(t *testing.T) {
	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("SERVER_ADDRESS", ":9090")
	os.Setenv("SERVER_READ_TIMEOUT", "30s")
	os.Setenv("SERVER_WRITE_TIMEOUT", "30s")
	os.Setenv("SERVER_IDLE_TIMEOUT", "120s")
	os.Setenv("SERVER_MAX_HEADER_BYTES", "2097152")
	os.Setenv("DB_HOST", "db.example.com")
	os.Setenv("DB_PORT", "5433")
	os.Setenv("DB_USER", "admin")
	os.Setenv("DB_PASSWORD", "secret123")
	os.Setenv("DB_NAME", "production_db")
	os.Setenv("DB_SSL_MODE", "require")
	os.Setenv("DB_POOL_MAX", "50")
	os.Setenv("DB_POOL_MIN", "5")
	os.Setenv("LOG_LEVEL", "error")
	os.Setenv("CHAIN_RPC_URL", "https://mainnet.infura.io/v3/abc123")
	os.Setenv("CHAIN_ID", "1")
	os.Setenv("KMS_PROVIDER", "aws")
	os.Setenv("KMS_KEY_ID", "arn:aws:kms:us-east-1:123456789:key/abc-123")

	cfg, err := Load()
	require.NoError(t, err)

	require.Equal(t, Production, cfg.Environment)
	require.Equal(t, ":9090", cfg.Server.Address)
	require.Equal(t, time.Second*30, cfg.Server.ReadTimeout)
	require.Equal(t, time.Second*30, cfg.Server.WriteTimeout)
	require.Equal(t, time.Second*120, cfg.Server.IdleTimeout)
	require.Equal(t, 2097152, cfg.Server.MaxHeaderBytes)
	require.Equal(t, "db.example.com", cfg.Database.Host)
	require.Equal(t, "5433", cfg.Database.Port)
	require.Equal(t, "admin", cfg.Database.User)
	require.Equal(t, "secret123", cfg.Database.Password)
	require.Equal(t, "production_db", cfg.Database.DBName)
	require.Equal(t, "require", cfg.Database.SSLMode)
	require.Equal(t, 50, cfg.Database.PoolMax)
	require.Equal(t, 5, cfg.Database.PoolMin)
	require.Equal(t, "error", cfg.LogLevel)

	// Check chain config
	require.Equal(t, "https://mainnet.infura.io/v3/abc123", cfg.Chain.RPCURL)
	require.Equal(t, "aws", cfg.Chain.KMS.Provider)
	require.Equal(t, "arn:aws:kms:us-east-1:123456789:key/abc-123", cfg.Chain.KMS.KeyID)
}
