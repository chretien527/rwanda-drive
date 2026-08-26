package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"time"

	"github.com/0xEmmyb2/CipherPass/internal/config"
	"github.com/0xEmmyb2/CipherPass/pkg/database"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"
)

// Role constants
const (
	RoleDriver     = "DRIVER"
	RoleOfficer    = "OFFICER"
	RoleAdmin      = "ADMIN"
	RoleSuperAdmin = "SUPER_ADMIN"
)

// Password hashing cost — 12 is a good balance of security and speed for a server
const bcryptCost = 12

// Service handles authentication-related business logic
type Service struct {
	db     *database.PostgresDB
	logger config.LoggerInterface
	cfg    *config.Config
}

// NewService creates a new authentication service
func NewService(db *database.PostgresDB, logger config.LoggerInterface, cfg *config.Config) *Service {
	return &Service{
		db:     db,
		logger: logger,
		cfg:    cfg,
	}
}

// User represents a user in the system
type User struct {
	ID                  string     `json:"id"`
	Email               string     `json:"email"`
	Phone               *string    `json:"phone,omitempty"`
	PasswordHash        string     `json:"-"`
	Role                string     `json:"role"`
	EmailVerified       bool       `json:"email_verified"`
	DocumentVerified    bool       `json:"document_verified"`
	BiometricVerified   bool       `json:"biometric_verified"`
	MFAEnabled          bool       `json:"mfa_enabled"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	LastLoginAt         *time.Time `json:"last_login_at,omitempty"`
	IsActive            bool       `json:"is_active"`
	FailedLoginAttempts int        `json:"-"`
	LockedUntil         *time.Time `json:"-"`
}

// scanUser is the shared column list for scanning a user row
const userScanColumns = `id, email, phone, password_hash, role, email_verified, document_verified, biometric_verified,
	mfa_enabled, created_at, updated_at, last_login_at, is_active, failed_login_attempts, locked_until`

// scanUserRow scans a database row into a User struct
func scanUserRow(scanner interface{ Scan(...interface{}) error }) (*User, error) {
	var user User
	err := scanner.Scan(
		&user.ID, &user.Email, &user.Phone, &user.PasswordHash, &user.Role,
		&user.EmailVerified, &user.DocumentVerified, &user.BiometricVerified,
		&user.MFAEnabled,
		&user.CreatedAt, &user.UpdatedAt, &user.LastLoginAt, &user.IsActive,
		&user.FailedLoginAttempts, &user.LockedUntil,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateUser registers a new user with the given role
func (s *Service) CreateUser(ctx context.Context, email, phone, password, role string) (*User, error) {
	hash, err := HashPassword(password)
	if err != nil {
		s.logger.WithError(err).Error("Failed to hash password")
		return nil, ErrInternal
	}

	row := s.db.QueryRowContext(ctx,
		`INSERT INTO users (email, phone, password_hash, role, email_verified, document_verified, biometric_verified, mfa_enabled, is_active)
		 VALUES ($1, NULLIF($2, ''), $3, $4, false, false, false, false, true)
		 RETURNING `+userScanColumns,
		email, phone, hash, role,
	)

	user, err := scanUserRow(row)
	if err != nil {
		s.logger.WithError(err).Error("Failed to create user")
		return nil, ErrInternal
	}

	s.logger.WithField("user_id", user.ID).Info("User created")
	return user, nil
}

// GetUserByEmail looks up a user by email
func (s *Service) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT `+userScanColumns+` FROM users WHERE email = $1`,
		email,
	)

	user, err := scanUserRow(row)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		s.logger.WithError(err).Error("Failed to fetch user by email")
		return nil, ErrInternal
	}

	return user, nil
}

// GetUserByID looks up a user by ID
func (s *Service) GetUserByID(ctx context.Context, id string) (*User, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT `+userScanColumns+` FROM users WHERE id = $1`,
		id,
	)

	user, err := scanUserRow(row)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		s.logger.WithError(err).Error("Failed to fetch user by ID")
		return nil, ErrInternal
	}

	return user, nil
}

// Authenticate verifies email+password and returns the user if valid.
// Gates: is_active, locked_until, email_verified checks.
func (s *Service) Authenticate(ctx context.Context, email, password string) (*User, error) {
	user, err := s.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if !user.IsActive {
		return nil, ErrAccountDisabled
	}

	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		return nil, ErrAccountLocked
	}

	// Email verification gate — unverified drivers cannot log in.
	// Officers/Admins are created via invite (email is verified at invite creation time).
	if user.Role == RoleDriver && !user.EmailVerified {
		return nil, ErrEmailNotVerified
	}

	if !CheckPasswordHash(user.PasswordHash, password) {
		// Increment failed attempts
		s.incrementFailedLoginAttempts(ctx, user)
		return nil, ErrInvalidCredentials
	}

	// Reset failed attempts and update last login
	_, err = s.db.ExecContext(ctx,
		`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
		user.ID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to update login info")
	}

	// Reload user with updated fields
	return s.GetUserByID(ctx, user.ID)
}

// incrementFailedLoginAttempts locks the account after 5 consecutive failures
func (s *Service) incrementFailedLoginAttempts(ctx context.Context, user *User) {
	const maxAttempts = 5
	newAttempts := user.FailedLoginAttempts + 1

	if newAttempts >= maxAttempts {
		lockDuration := 15 * time.Minute
		lockUntil := time.Now().Add(lockDuration)
		_, err := s.db.ExecContext(ctx,
			`UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
			newAttempts, lockUntil, user.ID,
		)
		if err != nil {
			s.logger.WithError(err).Error("Failed to lock account")
		}
		s.logger.WithField("user_id", user.ID).Warn("Account locked due to too many failed login attempts")
	} else {
		_, err := s.db.ExecContext(ctx,
			`UPDATE users SET failed_login_attempts = $1 WHERE id = $2`,
			newAttempts, user.ID,
		)
		if err != nil {
			s.logger.WithError(err).Error("Failed to increment failed login attempts")
		}
	}
}

// --- Password helpers ---

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPasswordHash compares a bcrypt hash with a plaintext password
func CheckPasswordHash(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// --- Random token helpers ---

// GenerateRandomBytes returns securely random bytes
func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}
	return b, nil
}

// GenerateRandomHex returns a securely random hex string
func GenerateRandomHex(n int) (string, error) {
	bytes, err := GenerateRandomBytes(n)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ════════════════════════════════════════════════
// MFA Login Token (short-lived JWT for the MFA step)
// ════════════════════════════════════════════════

// MFALoginClaims is a special JWT used only during the MFA login flow.
type MFALoginClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// GenerateMFALoginToken creates a short-lived (5 min) JWT for the MFA verification step.
func (s *Service) GenerateMFALoginToken(ctx context.Context, userID string) (string, error) {
	claims := &MFALoginClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
			Issuer:    "cipherpass-mfa",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.cfg.Server.JWTSecret)
	if err != nil {
		s.logger.WithError(err).Error("Failed to sign MFA login token")
		return "", ErrInternal
	}

	return tokenString, nil
}

// ValidateMFALoginToken parses and validates an MFA login token, returning the user ID.
func (s *Service) ValidateMFALoginToken(tokenString string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenString, &MFALoginClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrTokenInvalid
		}
		return s.cfg.Server.JWTSecret, nil
	})

	if err != nil {
		return "", ErrTokenInvalid
	}

	claims, ok := token.Claims.(*MFALoginClaims)
	if !ok || !token.Valid {
		return "", ErrTokenInvalid
	}

	return claims.UserID, nil
}

// MarkEmailVerified directly marks a user's email as verified (used for invite-based provisioning)
func (s *Service) MarkEmailVerified(ctx context.Context, userID string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE users SET email_verified = true WHERE id = $1`,
		userID,
	)
	return err
}
