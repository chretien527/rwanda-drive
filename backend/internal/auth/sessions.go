package auth

import (
	"context"
	"database/sql"
	"time"
)

// Session represents an active user session
type Session struct {
	ID          string     `json:"id"`
	UserAgent   string     `json:"user_agent"`
	IPAddress   string     `json:"ip_address"`
	DeviceID    string     `json:"device_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt   time.Time  `json:"expires_at"`
	IsCurrent   bool       `json:"is_current"` // true if this is the session that made the request
}

// ListSessions returns all active (non-revoked, non-expired) sessions for a user.
// currentRefreshTokenHash is used to mark which session is "current".
func (s *Service) ListSessions(ctx context.Context, userID, currentRefreshTokenHash string) ([]Session, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_agent, ip_address, device_id, created_at, last_used_at, expires_at
		 FROM refresh_tokens
		 WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to list sessions")
		return nil, ErrInternal
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var sess Session
		if err := rows.Scan(
			&sess.ID, &sess.UserAgent, &sess.IPAddress, &sess.DeviceID,
			&sess.CreatedAt, &sess.LastUsedAt, &sess.ExpiresAt,
		); err != nil {
			s.logger.WithError(err).Error("Failed to scan session row")
			continue
		}
		sessions = append(sessions, sess)
	}

	return sessions, nil
}

// RevokeSession revokes a specific refresh token (session) by ID.
// Only allows revoking sessions belonging to the given user.
func (s *Service) RevokeSession(ctx context.Context, userID, sessionID string) error {
	result, err := s.db.ExecContext(ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW()
		 WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
		sessionID, userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to revoke session")
		return ErrInternal
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ErrInternal
	}

	if rowsAffected == 0 {
		return ErrSessionNotFound
	}

	s.logger.WithFields(map[string]interface{}{
		"user_id":    userID,
		"session_id": sessionID,
	}).Info("Session revoked")

	return nil
}

// UpdateSessionLastUsed updates the last_used_at timestamp for a session.
func (s *Service) UpdateSessionLastUsed(ctx context.Context, tokenHash string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE refresh_tokens SET last_used_at = NOW() WHERE token_hash = $1`,
		tokenHash,
	)
	return err
}

// GetSessionByTokenHash retrieves a single session by its token hash.
func (s *Service) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*Session, error) {
	var sess Session
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_agent, ip_address, device_id, created_at, last_used_at, expires_at
		 FROM refresh_tokens WHERE token_hash = $1`,
		tokenHash,
	).Scan(&sess.ID, &sess.UserAgent, &sess.IPAddress, &sess.DeviceID,
		&sess.CreatedAt, &sess.LastUsedAt, &sess.ExpiresAt)

	if err == sql.ErrNoRows {
		return nil, ErrSessionNotFound
	}
	if err != nil {
		return nil, ErrInternal
	}

	return &sess, nil
}

// CleanExpiredSessions removes expired refresh tokens from the database.
// Should be called periodically (e.g., via a cron job).
func (s *Service) CleanExpiredSessions(ctx context.Context) error {
	result, err := s.db.ExecContext(ctx,
		`DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at < NOW() - INTERVAL '7 days'`,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to clean expired sessions")
		return err
	}

	rows, _ := result.RowsAffected()
	if rows > 0 {
		s.logger.WithField("count", rows).Info("Cleaned expired sessions")
	}

	return nil
}
