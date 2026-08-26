package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"math/big"
	"time"
)

const (
	otpLength       = 6
	otpTTL          = 5 * time.Minute
	otpMaxAttempts  = 3
	otpResendWindow = 15 * time.Minute
	otpResendLimit  = 3
)

// PhoneOTP represents a phone OTP verification record
type PhoneOTP struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	Code      string     `json:"-"` // Never expose in JSON
	Purpose   string     `json:"purpose"`
	ExpiresAt time.Time  `json:"expires_at"`
	VerifiedAt *time.Time `json:"verified_at,omitempty"`
	Attempts  int        `json:"attempts"`
	CreatedAt time.Time  `json:"created_at"`
}

// GeneratePhoneOTP creates a 6-digit OTP code for the given purpose.
// Returns the plaintext code (to be sent via SMS) and any error.
func (s *Service) GeneratePhoneOTP(ctx context.Context, userID, purpose string) (string, error) {
	// Invalidate any previous unverified OTPs of the same purpose
	_, err := s.db.ExecContext(ctx,
		`DELETE FROM phone_otps WHERE user_id = $1 AND purpose = $2 AND verified_at IS NULL`,
		userID, purpose,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to invalidate old OTPs")
	}

	// Generate 6-digit code
	code, err := generateOTPCode()
	if err != nil {
		s.logger.WithError(err).Error("Failed to generate OTP code")
		return "", ErrInternal
	}

	expiresAt := time.Now().Add(otpTTL)

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO phone_otps (user_id, code, purpose, expires_at)
		 VALUES ($1, $2, $3, $4)`,
		userID, code, purpose, expiresAt,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to store OTP")
		return "", ErrInternal
	}

	s.logger.WithFields(map[string]interface{}{
		"user_id": userID,
		"purpose": purpose,
	}).Info("Phone OTP generated")

	return code, nil
}

// VerifyPhoneOTP validates an OTP code for the given purpose.
func (s *Service) VerifyPhoneOTP(ctx context.Context, userID, code, purpose string) error {
	var otpID string
	var storedCode string
	var expiresAt time.Time
	var verifiedAt sql.NullTime
	var attempts int

	err := s.db.QueryRowContext(ctx,
		`SELECT id, code, expires_at, verified_at, attempts
		 FROM phone_otps
		 WHERE user_id = $1 AND purpose = $2
		 ORDER BY created_at DESC LIMIT 1`,
		userID, purpose,
	).Scan(&otpID, &storedCode, &expiresAt, &verifiedAt, &attempts)

	if err == sql.ErrNoRows {
		return ErrOTPNotFound
	}
	if err != nil {
		s.logger.WithError(err).Error("Failed to look up OTP")
		return ErrInternal
	}

	if verifiedAt.Valid {
		return ErrOTPAlreadyVerified
	}

	if time.Now().After(expiresAt) {
		return ErrOTPExpired
	}

	if attempts >= otpMaxAttempts {
		return ErrOTPMaxAttempts
	}

	// Increment attempts
	_, err = s.db.ExecContext(ctx,
		`UPDATE phone_otps SET attempts = attempts + 1 WHERE id = $1`,
		otpID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to increment OTP attempts")
	}

	if storedCode != code {
		return ErrOTPInvalid
	}

	// Mark as verified
	_, err = s.db.ExecContext(ctx,
		`UPDATE phone_otps SET verified_at = NOW() WHERE id = $1`,
		otpID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to mark OTP as verified")
		return ErrInternal
	}

	s.logger.WithFields(map[string]interface{}{
		"user_id": userID,
		"purpose": purpose,
	}).Info("Phone OTP verified")

	return nil
}

// CheckPhoneOTPRateLimit checks if the user has exceeded the OTP resend rate limit.
func (s *Service) CheckPhoneOTPRateLimit(ctx context.Context, userID, purpose string) error {
	var count int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM phone_otps
		 WHERE user_id = $1 AND purpose = $2
		   AND created_at > NOW() - $3::INTERVAL`,
		userID, purpose, fmt.Sprintf("%d minutes", int(otpResendWindow.Minutes())),
	).Scan(&count)
	if err != nil {
		s.logger.WithError(err).Error("Failed to count recent OTPs")
		return ErrInternal
	}

	if count >= otpResendLimit {
		return ErrRateLimited
	}
	return nil
}

// generateOTPCode generates a cryptographically random 6-digit code
func generateOTPCode() (string, error) {
	max := big.NewInt(999999)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	// Pad with leading zeros to always be 6 digits
	return fmt.Sprintf("%06d", n.Int64()), nil
}
