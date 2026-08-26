package auth

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"time"
)

// EmailVerification represents an email verification token
type EmailVerification struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	ExpiresAt time.Time  `json:"expires_at"`
	VerifiedAt *time.Time `json:"verified_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// GenerateEmailVerification creates a new email verification token for the user.
// Returns the plaintext token (to be sent via email) and any error.
func (s *Service) GenerateEmailVerification(ctx context.Context, userID string) (string, error) {
	// Invalidate any previous unverified tokens for this user
	_, err := s.db.ExecContext(ctx,
		`DELETE FROM email_verifications WHERE user_id = $1 AND verified_at IS NULL`,
		userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to invalidate old email verification tokens")
	}

	// Generate a secure random token
	token, err := GenerateRandomHex(32)
	if err != nil {
		s.logger.WithError(err).Error("Failed to generate email verification token")
		return "", ErrInternal
	}

	tokenHash := emailVerifyTokenHash(token)
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO email_verifications (user_id, token_hash, expires_at)
		 VALUES ($1, $2, $3)`,
		userID, tokenHash, expiresAt,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to store email verification token")
		return "", ErrInternal
	}

	s.logger.WithField("user_id", userID).Info("Email verification token generated")
	return token, nil
}

// VerifyEmail verifies an email verification token and marks the user as verified.
func (s *Service) VerifyEmail(ctx context.Context, token string) error {
	tokenHash := emailVerifyTokenHash(token)

	var verificationID string
	var userID string
	var expiresAt time.Time
	var verifiedAt sql.NullTime

	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, expires_at, verified_at
		 FROM email_verifications WHERE token_hash = $1`,
		tokenHash,
	).Scan(&verificationID, &userID, &expiresAt, &verifiedAt)

	if err == sql.ErrNoRows {
		return ErrEmailVerificationNotFound
	}
	if err != nil {
		s.logger.WithError(err).Error("Failed to look up email verification token")
		return ErrInternal
	}

	if verifiedAt.Valid {
		return ErrEmailAlreadyVerified
	}

	if time.Now().After(expiresAt) {
		return ErrEmailVerificationExpired
	}

	// Mark the token as verified
	_, err = s.db.ExecContext(ctx,
		`UPDATE email_verifications SET verified_at = NOW() WHERE id = $1`,
		verificationID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to mark email verification as verified")
		return ErrInternal
	}

	// Mark the user as email verified
	_, err = s.db.ExecContext(ctx,
		`UPDATE users SET email_verified = true WHERE id = $1`,
		userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to update user email_verified status")
		return ErrInternal
	}

	s.logger.WithField("user_id", userID).Info("Email verified successfully")
	return nil
}

// ResendEmailVerification generates a new verification token for the user.
// Rate-limited: max 3 per hour per user.
func (s *Service) ResendEmailVerification(ctx context.Context, userID string) (string, error) {
	// Check rate limit: count unverified tokens created in the last hour
	var count int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM email_verifications
		 WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
		userID,
	).Scan(&count)
	if err != nil {
		s.logger.WithError(err).Error("Failed to count recent email verification tokens")
		return "", ErrInternal
	}

	if count >= 3 {
		return "", ErrRateLimited
	}

	return s.GenerateEmailVerification(ctx, userID)
}

// emailVerifyTokenHash hashes an email verification token for storage
func emailVerifyTokenHash(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
