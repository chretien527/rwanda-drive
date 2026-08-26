package auth

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenPair holds access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"` // seconds until access token expires
	TokenType    string `json:"token_type"`
}

// Claims extends jwt.RegisteredClaims with app-specific fields
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

const (
	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 7 * 24 * time.Hour // 7 days
)

// GenerateTokenPair creates a new access + refresh token pair
func (s *Service) GenerateTokenPair(ctx context.Context, user *User, userAgent, ipAddress string) (*TokenPair, error) {
	// Generate access token
	accessClaims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
			Issuer:    "cipherpass",
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(s.cfg.Server.JWTSecret)
	if err != nil {
		s.logger.WithError(err).Error("Failed to sign access token")
		return nil, ErrInternal
	}

	// Generate refresh token
	refreshToken, err := GenerateRandomHex(32)
	if err != nil {
		s.logger.WithError(err).Error("Failed to generate refresh token")
		return nil, ErrInternal
	}

	// Hash the refresh token for storage (never store plaintext tokens)
	refreshTokenHash := hashToken(refreshToken)

	// Store refresh token in database
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
		 VALUES ($1, $2, $3, $4, $5)`,
		user.ID, refreshTokenHash, time.Now().Add(refreshTokenTTL), userAgent, ipAddress,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to store refresh token")
		return nil, ErrInternal
	}

	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(accessTokenTTL.Seconds()),
		TokenType:    "Bearer",
	}, nil
}

// ValidateAccessToken parses and validates an access token, returning claims
func (s *Service) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrTokenInvalid
		}
		return s.cfg.Server.JWTSecret, nil
	})

	if err != nil {
		return nil, ErrTokenInvalid
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrTokenInvalid
	}

	return claims, nil
}

// RefreshAccessToken takes a valid refresh token and issues a new token pair
func (s *Service) RefreshAccessToken(ctx context.Context, refreshTokenString string, userAgent, ipAddress string) (*TokenPair, error) {
	refreshHash := hashToken(refreshTokenString)

	// Find and validate the refresh token
	var userID string
	var expiresAt time.Time
	var revokedAt sql.NullTime

	err := s.db.QueryRowContext(ctx,
		`SELECT user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`,
		refreshHash,
	).Scan(&userID, &expiresAt, &revokedAt)

	if err == sql.ErrNoRows {
		return nil, ErrTokenInvalid
	}
	if err != nil {
		s.logger.WithError(err).Error("Failed to look up refresh token")
		return nil, ErrInternal
	}

	if revokedAt.Valid {
		// This refresh token was already used — possible token theft, revoke all sessions
		s.logger.WithField("user_id", userID).Warn("Refresh token reuse detected, revoking all sessions")
		s.RevokeAllUserTokens(ctx, userID)
		return nil, ErrTokenRevoked
	}

	if time.Now().After(expiresAt) {
		return nil, ErrTokenExpired
	}

	// Revoke the current refresh token (rotate it)
	_, err = s.db.ExecContext(ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
		refreshHash,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to revoke old refresh token")
	}

	// Issue new token pair
	user, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.GenerateTokenPair(ctx, user, userAgent, ipAddress)
}

// RevokeRefreshToken invalidates a single refresh token
func (s *Service) RevokeRefreshToken(ctx context.Context, refreshTokenString string) error {
	refreshHash := hashToken(refreshTokenString)
	_, err := s.db.ExecContext(ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
		refreshHash,
	)
	return err
}

// RevokeAllUserTokens invalidates all refresh tokens for a user (full logout / security event)
func (s *Service) RevokeAllUserTokens(ctx context.Context, userID string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
		userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to revoke all user tokens")
	}
	return err
}

// hashToken creates a SHA-256 hash of a token for secure storage
func hashToken(token string) string {
	// Using SHA-256 for token hashing — fast for lookups, tokens are random so no salt needed
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
