package auth

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"time"
)

// PasswordReset represents a password reset token
type PasswordReset struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// ChangePassword changes the password for an authenticated user.
// Requires the current password for verification.
func (s *Service) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	user, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return err
	}

	// Verify current password
	if !CheckPasswordHash(user.PasswordHash, currentPassword) {
		return ErrInvalidCredentials
	}

	// Hash new password
	hash, err := HashPassword(newPassword)
	if err != nil {
		s.logger.WithError(err).Error("Failed to hash new password")
		return ErrInternal
	}

	// Update password
	_, err = s.db.ExecContext(ctx,
		`UPDATE users SET password_hash = $1 WHERE id = $2`,
		hash, userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to update password")
		return ErrInternal
	}

	// Revoke all existing sessions (force re-login after password change)
	if err := s.RevokeAllUserTokens(ctx, userID); err != nil {
		s.logger.WithError(err).Error("Failed to revoke sessions after password change")
		// Non-fatal — password was changed successfully
	}

	s.logger.WithField("user_id", userID).Info("Password changed")
	return nil
}

// ForgotPassword generates a password reset token and returns it.
// The token should be sent via email (mock for MVP).
func (s *Service) ForgotPassword(ctx context.Context, email string) (string, error) {
	user, err := s.GetUserByEmail(ctx, email)
	if err != nil {
		// Don't reveal whether the email exists — return success regardless
		return "", nil
	}

	// Invalidate any previous unused reset tokens
	_, err = s.db.ExecContext(ctx,
		`DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL`,
		user.ID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to invalidate old password reset tokens")
	}

	// Generate token
	token, err := GenerateRandomHex(32)
	if err != nil {
		s.logger.WithError(err).Error("Failed to generate password reset token")
		return "", ErrInternal
	}

	tokenHash := passwordResetTokenHash(token)
	expiresAt := time.Now().Add(1 * time.Hour) // 1 hour expiry

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO password_resets (user_id, token_hash, expires_at)
		 VALUES ($1, $2, $3)`,
		user.ID, tokenHash, expiresAt,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to store password reset token")
		return "", ErrInternal
	}

	s.logger.WithField("user_id", user.ID).Info("Password reset token generated")
	return token, nil
}

// ResetPassword uses a reset token to set a new password.
func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	tokenHash := passwordResetTokenHash(token)

	var resetID string
	var userID string
	var expiresAt time.Time
	var usedAt sql.NullTime

	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, expires_at, used_at
		 FROM password_resets WHERE token_hash = $1`,
		tokenHash,
	).Scan(&resetID, &userID, &expiresAt, &usedAt)

	if err == sql.ErrNoRows {
		return ErrPasswordResetNotFound
	}
	if err != nil {
		s.logger.WithError(err).Error("Failed to look up password reset token")
		return ErrInternal
	}

	if usedAt.Valid {
		return ErrPasswordResetUsed
	}

	if time.Now().After(expiresAt) {
		return ErrPasswordResetExpired
	}

	// Hash new password
	hash, err := HashPassword(newPassword)
	if err != nil {
		s.logger.WithError(err).Error("Failed to hash new password")
		return ErrInternal
	}

	// Begin transaction: mark token as used + update password
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ErrInternal
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx,
		`UPDATE password_resets SET used_at = NOW() WHERE id = $1`,
		resetID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to mark password reset as used")
		return ErrInternal
	}

	_, err = tx.ExecContext(ctx,
		`UPDATE users SET password_hash = $1 WHERE id = $2`,
		hash, userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to update password via reset")
		return ErrInternal
	}

	if err = tx.Commit(); err != nil {
		s.logger.WithError(err).Error("Failed to commit password reset transaction")
		return ErrInternal
	}

	// Revoke all sessions for this user (force re-login)
	if err := s.RevokeAllUserTokens(ctx, userID); err != nil {
		s.logger.WithError(err).Error("Failed to revoke sessions after password reset")
	}

	s.logger.WithField("user_id", userID).Info("Password reset completed")
	return nil
}

// passwordResetTokenHash hashes a password reset token for storage
func passwordResetTokenHash(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
