package auth

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"time"
)

// InviteToken represents an invitation token for officer/admin provisioning
type InviteToken struct {
	ID        string     `json:"id"`
	Token     string     `json:"token,omitempty"` // Only populated on creation
	Role      string     `json:"role"`
	Email     *string    `json:"email,omitempty"`
	ExpiresAt time.Time  `json:"expires_at"`
	AcceptedAt *time.Time `json:"accepted_at,omitempty"`
	CreatedBy string     `json:"created_by"`
	CreatedAt time.Time  `json:"created_at"`
}

// InviteService handles invitation token generation and validation
type InviteService struct {
	service *Service
}

// NewInviteService creates a new invitation service
func NewInviteService(service *Service) *InviteService {
	return &InviteService{service: service}
}

// GenerateInvite creates a new invitation token for the specified role
// Only ADMIN and SUPER_ADMIN can create invites
func (s *InviteService) GenerateInvite(ctx context.Context, role, email, createdBy string) (*InviteToken, error) {
	// Validate role
	if role != RoleOfficer && role != RoleAdmin {
		return nil, ErrInvalidRole
	}

	// Generate secure random token
	token, err := GenerateRandomHex(32)
	if err != nil {
		s.service.logger.WithError(err).Error("Failed to generate invite token")
		return nil, ErrInternal
	}

	// Hash token for storage
	tokenHash := inviteTokenHash(token)

	// Set expiration (24 hours from now)
	expiresAt := time.Now().Add(24 * time.Hour)

	// Store in database
	var invite InviteToken
	err = s.service.db.QueryRowContext(ctx,
		`INSERT INTO invite_tokens (token_hash, role, email, created_by, expires_at)
		 VALUES ($1, $2, NULLIF($3, ''), $4, $5)
		 RETURNING id, role, email, expires_at, created_at`,
		tokenHash, role, email, createdBy, expiresAt,
	).Scan(&invite.ID, &invite.Role, &invite.Email, &invite.ExpiresAt, &invite.CreatedAt)

	if err != nil {
		s.service.logger.WithError(err).Error("Failed to store invite token")
		return nil, ErrInternal
	}

	invite.Token = token // Plaintext token is only returned once, on creation

	s.service.logger.WithFields(map[string]interface{}{
		"role":       role,
		"email":      email,
		"created_by": createdBy,
	}).Info("Invitation token created")

	return &invite, nil
}

// ValidateInvite checks if an invitation token is valid and not expired/used
func (s *InviteService) ValidateInvite(ctx context.Context, token string) (*InviteToken, error) {
	tokenHash := inviteTokenHash(token)

	var invite InviteToken
	err := s.service.db.QueryRowContext(ctx,
		`SELECT id, role, email, expires_at, accepted_at, created_by, created_at
		 FROM invite_tokens WHERE token_hash = $1`,
		tokenHash,
	).Scan(&invite.ID, &invite.Role, &invite.Email, &invite.ExpiresAt, &invite.AcceptedAt, &invite.CreatedBy, &invite.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrInviteNotFound
	}
	if err != nil {
		s.service.logger.WithError(err).Error("Failed to look up invite token")
		return nil, ErrInternal
	}

	if invite.AcceptedAt != nil {
		return nil, ErrInviteAlreadyUsed
	}

	if time.Now().After(invite.ExpiresAt) {
		return nil, ErrInviteNotFound // Treat expired as not found (don't leak timing info)
	}

	return &invite, nil
}

// AcceptInvite marks an invitation as used and creates the user account
func (s *InviteService) AcceptInvite(ctx context.Context, token, email, phone, password string) (*User, error) {
	// Validate the token
	invite, err := s.ValidateInvite(ctx, token)
	if err != nil {
		return nil, err
	}

	// If invite has an email restriction, check it matches
	if invite.Email != nil && *invite.Email != email {
		return nil, ErrInviteEmailMismatch
	}

	// Begin transaction
	tx, err := s.service.db.BeginTx(ctx, nil)
	if err != nil {
		s.service.logger.WithError(err).Error("Failed to begin transaction")
		return nil, ErrInternal
	}
	defer tx.Rollback()

	// Mark invite as accepted
	_, err = tx.ExecContext(ctx,
		`UPDATE invite_tokens SET accepted_at = NOW() WHERE id = $1`,
		invite.ID,
	)
	if err != nil {
		s.service.logger.WithError(err).Error("Failed to mark invite as accepted")
		return nil, ErrInternal
	}

	// Create user with the invited role
	hash, err := HashPassword(password)
	if err != nil {
		s.service.logger.WithError(err).Error("Failed to hash password")
		return nil, ErrInternal
	}

	var user User
	err = tx.QueryRowContext(ctx,
		`INSERT INTO users (email, phone, password_hash, role, document_verified, biometric_verified, is_active)
		 VALUES ($1, NULLIF($2, ''), $3, $4, false, false, true)
		 RETURNING id, email, phone, password_hash, role, document_verified, biometric_verified,
		           created_at, updated_at, last_login_at, is_active, failed_login_attempts, locked_until`,
		email, phone, hash, invite.Role,
	).Scan(
		&user.ID, &user.Email, &user.Phone, &user.PasswordHash, &user.Role,
		&user.DocumentVerified, &user.BiometricVerified,
		&user.CreatedAt, &user.UpdatedAt, &user.LastLoginAt, &user.IsActive,
		&user.FailedLoginAttempts, &user.LockedUntil,
	)

	if err != nil {
		s.service.logger.WithError(err).Error("Failed to create user from invite")
		return nil, ErrInternal
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		s.service.logger.WithError(err).Error("Failed to commit invite acceptance transaction")
		return nil, ErrInternal
	}

	s.service.logger.WithFields(map[string]interface{}{
		"user_id": user.ID,
		"role":    user.Role,
	}).Info("Invitation accepted, user created")

	return &user, nil
}

// inviteTokenHash creates a SHA-256 hash of an invite token
func inviteTokenHash(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
