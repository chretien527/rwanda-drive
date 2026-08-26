package chain

import (
	"context"
	"database/sql"
	"fmt"
	"math/big"

	"github.com/0xEmmyb2/CipherPass/internal/config"
	"github.com/0xEmmyb2/CipherPass/pkg/bindings"
	"github.com/0xEmmyb2/CipherPass/pkg/database"
	"github.com/ethereum/go-ethereum/common"
)

// Service provides high-level blockchain operations.
type Service struct {
	client   *Client
	license  *bindings.LicenseRegistry
	credReg  *bindings.CredentialRegistry
	audit    *bindings.AuditAnchor
	db       *database.PostgresDB
	logger   config.LoggerInterface
	cfg      config.ChainConfig
}

// NewService creates a chain service with all contract bindings.
func NewService(db *database.PostgresDB, logger config.LoggerInterface, cfg config.ChainConfig, signer Signer) (*Service, error) {
	// Validate contract addresses
	RequireValidAddress(cfg.LicenseRegistry, "LicenseRegistry")
	RequireValidAddress(cfg.CredentialRegistry, "CredentialRegistry")
	RequireValidAddress(cfg.AuditAnchor, "AuditAnchor")

	// Create RPC client
	client, err := NewClient(cfg, signer)
	if err != nil {
		return nil, fmt.Errorf("failed to create chain client: %w", err)
	}

	// Create contract bindings
	license, err := bindings.NewLicenseRegistry(cfg.LicenseRegistry)
	if err != nil {
		return nil, fmt.Errorf("failed to bind LicenseRegistry: %w", err)
	}
	credReg, err := bindings.NewCredentialRegistry(cfg.CredentialRegistry)
	if err != nil {
		return nil, fmt.Errorf("failed to bind CredentialRegistry: %w", err)
	}
	audit, err := bindings.NewAuditAnchor(cfg.AuditAnchor)
	if err != nil {
		return nil, fmt.Errorf("failed to bind AuditAnchor: %w", err)
	}

	return &Service{
		client:  client,
		license: license,
		credReg: credReg,
		audit:   audit,
		db:      db,
		logger:  logger,
		cfg:     cfg,
	}, nil
}

// --- License Issuance ---

// IssueLicenseResult contains the result of a license issuance.
type IssueLicenseResult struct {
	Keccak256Leaf [32]byte `json:"keccak256_leaf"`
	MiMCLeaf      []byte   `json:"mimc_leaf"`
	LeafIndex     int64    `json:"leaf_index"`
	TxHash        string   `json:"tx_hash"`
}

// IssueLicense issues a new license on-chain and stores the dual-hash in Postgres.
// This is the main entry point for the "Issue License" admin action.
func (s *Service) IssueLicense(ctx context.Context, userID string, record LicenseRecord) (*IssueLicenseResult, error) {
	// 1. Compute both leaf hashes
	keccakLeaf := ComputeKeccak256Leaf(record)
	mimcLeaf := ComputeMiMCLeaf(record)

	s.logger.WithFields(map[string]interface{}{
		"user_id":        userID,
		"licence_number": record.LicenceNumber,
	}).Info("Computing license leaf hashes")

	// 2. Check if already issued
	alreadyIssued, err := s.isLeafIssued(ctx, keccakLeaf)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing issuance: %w", err)
	}
	if alreadyIssued {
		return nil, fmt.Errorf("license already issued for this leaf hash")
	}

	// 3. Build and send the issueLicense transaction
	nonce, err := s.client.PendingNonce(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}

	gasPrice, err := s.client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to suggest gas price: %w", err)
	}

	calldata, err := s.license.PackIssueLicense(keccakLeaf)
	if err != nil {
		return nil, fmt.Errorf("failed to pack issueLicense call: %w", err)
	}

	tx := NewTransaction(
		nonce,
		s.cfg.LicenseRegistry,
		big.NewInt(0), // No ETH value
		200_000,        // Gas limit
		gasPrice,
		calldata,
	)

	signedTx, err := s.client.SendSignedTransaction(ctx, tx)
	if err != nil {
		return nil, fmt.Errorf("failed to send issueLicense transaction: %w", err)
	}

	s.logger.WithField("tx_hash", signedTx.Hash().Hex()).Info("issueLicense transaction sent")

	// 4. Store the dual-hash in Postgres (before on-chain confirmation)
	//    The event listener will update leaf_index and on_chain_root when confirmed.
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO license_leaves (user_id, licence_number, keccak256_leaf, miMC_leaf, issued_at)
		 VALUES ($1, $2, $3, $4, NOW())
		 ON CONFLICT (keccak256_leaf) DO NOTHING`,
		userID, record.LicenceNumber, keccakLeaf[:], mimcLeaf,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to store license leaf in Postgres")
		// Transaction was sent — don't return error, the event listener will sync
	}

	// 5. Insert into shadow Merkle tree
	if err := s.insertIntoShadowTree(ctx, mimcLeaf); err != nil {
		s.logger.WithError(err).Error("Failed to insert into shadow Merkle tree")
	}

	return &IssueLicenseResult{
		Keccak256Leaf: keccakLeaf,
		MiMCLeaf:      mimcLeaf,
		TxHash:        signedTx.Hash().Hex(),
	}, nil
}

// isLeafIssued checks if a leaf hash has already been issued on-chain.
func (s *Service) isLeafIssued(ctx context.Context, leafHash [32]byte) (bool, error) {
	calldata, err := s.license.PackIsIssued(leafHash)
	if err != nil {
		return false, err
	}

	msg := s.client.BuildContractCall(s.cfg.LicenseRegistry, calldata)
	result, err := s.client.CallContract(ctx, msg)
	if err != nil {
		return false, err
	}

	return s.license.UnpackIsIssued(result)
}

// --- Credential Status ---

// CredentialStatus represents the on-chain credential status.
type CredentialStatus uint8

const (
	StatusNone     CredentialStatus = CredentialStatus(bindings.CredentialNone)
	StatusActive   CredentialStatus = CredentialStatus(bindings.CredentialActive)
	StatusRevoked  CredentialStatus = CredentialStatus(bindings.CredentialRevoked)
	StatusSuspended CredentialStatus = CredentialStatus(bindings.CredentialSuspended)
)

// CheckCredentialStatus returns the on-chain status of a credential.
func (s *Service) CheckCredentialStatus(ctx context.Context, credentialHash [32]byte) (CredentialStatus, error) {
	calldata, err := s.credReg.PackCheckStatus(credentialHash)
	if err != nil {
		return StatusNone, err
	}

	msg := s.client.BuildContractCall(s.cfg.CredentialRegistry, calldata)
	result, err := s.client.CallContract(ctx, msg)
	if err != nil {
		return StatusNone, err
	}

	status, err := s.credReg.UnpackCheckStatus(result)
	if err != nil {
		return StatusNone, err
	}

	return CredentialStatus(status), nil
}

// IsCredentialActive is a convenience check: returns true only if status == ACTIVE.
func (s *Service) IsCredentialActive(ctx context.Context, credentialHash [32]byte) (bool, error) {
	status, err := s.CheckCredentialStatus(ctx, credentialHash)
	return status == StatusActive, err
}

// --- Audit Anchoring ---

// AnchorAuditBatch anchors a batch of audit log entries on-chain.
// batchRoot is the Merkle root computed over the batch's log entry hashes.
func (s *Service) AnchorAuditBatch(ctx context.Context, batchID *big.Int, batchRoot [32]byte) (string, error) {
	nonce, err := s.client.PendingNonce(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	gasPrice, err := s.client.SuggestGasPrice(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to suggest gas price: %w", err)
	}

	calldata, err := s.audit.PackAnchorBatch(batchID, batchRoot)
	if err != nil {
		return "", fmt.Errorf("failed to pack anchorBatch call: %w", err)
	}

	tx := NewTransaction(
		nonce,
		s.cfg.AuditAnchor,
		big.NewInt(0),
		100_000,
		gasPrice,
		calldata,
	)

	signedTx, err := s.client.SendSignedTransaction(ctx, tx)
	if err != nil {
		return "", fmt.Errorf("failed to send anchorBatch transaction: %w", err)
	}

	s.logger.WithFields(map[string]interface{}{
		"batch_id": batchID.String(),
		"tx_hash":  signedTx.Hash().Hex(),
	}).Info("Audit batch anchored on-chain")

	return signedTx.Hash().Hex(), nil
}

// --- Shadow Merkle Tree (ZK) ---

// GetShadowTreeRoot returns the current root of the ZK shadow Merkle tree.
func (s *Service) GetShadowTreeRoot(ctx context.Context) ([]byte, error) {
	var root []byte
	err := s.db.QueryRowContext(ctx,
		`SELECT root FROM shadow_merkle_state WHERE id = 1`,
	).Scan(&root)
	if err != nil {
		return nil, err
	}
	return root, nil
}

// GetShadowTreeSiblings returns the Merkle path (sibling hashes) for a given leaf index
// in the shadow tree. Used by the ZK prover to generate inclusion proofs.
func (s *Service) GetShadowTreeSiblings(ctx context.Context, leafIndex int64) ([][]byte, error) {
	siblings := make([][]byte, TreeDepth)
	for level := 0; level < TreeDepth; level++ {
		// Sibling position depends on the path bits
		siblingPos := leafIndex
		if (leafIndex>>uint(level))%2 == 0 {
			siblingPos = leafIndex | (1 << uint(level))
		} else {
			siblingPos = leafIndex &^ (1 << uint(level))
		}

		err := s.db.QueryRowContext(ctx,
			`SELECT hash FROM shadow_merkle_nodes WHERE level = $1 AND position = $2`,
			level, siblingPos,
		).Scan(&siblings[level])
		if err == sql.ErrNoRows {
			// Use the zero hash for this level
			zeros := emptyTreeRoots()
			siblings[level] = zeros[level][:]
		} else if err != nil {
			return nil, err
		}
	}
	return siblings, nil
}

// insertIntoShadowTree adds a new leaf to the shadow Merkle tree and recomputes affected nodes.
func (s *Service) insertIntoShadowTree(ctx context.Context, leafHash []byte) error {
	// Get current state
	var state ShadowMerkleState
	err := s.db.QueryRowContext(ctx,
		`SELECT root, next_index FROM shadow_merkle_state WHERE id = 1`,
	).Scan(&state.Root, &state.NextIndex)
	if err != nil {
		return err
	}

	leafIndex := state.NextIndex
	zeros := emptyTreeRoots()

	// Insert the leaf at level 0
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO shadow_merkle_nodes (level, position, hash) VALUES (0, $1, $2)
		 ON CONFLICT (level, position) DO UPDATE SET hash = $2, updated_at = NOW()`,
		leafIndex, leafHash,
	)
	if err != nil {
		return err
	}

	// Recompute affected nodes up the tree
	currentHash := leafHash
	for level := 0; level < TreeDepth; level++ {
		var siblingHash []byte
		var siblingPos int64

		if (leafIndex>>uint(level))%2 == 0 {
			// Current node is left child; sibling is right
			siblingPos = leafIndex | (1 << uint(level))
			// Try to get sibling from DB; if not found, use zero
			err = s.db.QueryRowContext(ctx,
				`SELECT hash FROM shadow_merkle_nodes WHERE level = $1 AND position = $2`,
				level, siblingPos,
			).Scan(&siblingHash)
			if err == sql.ErrNoRows {
				siblingHash = zeros[level][:]
			} else if err != nil {
				return err
			}
			// Parent = hash(current || sibling)
			parentHash := mimcHash(append(currentHash, siblingHash...))
			parentPos := leafIndex >> uint(level+1)
			currentHash = parentHash
			_, err = s.db.ExecContext(ctx,
				`INSERT INTO shadow_merkle_nodes (level + 1, position, hash) VALUES ($1, $2, $3)
				 ON CONFLICT (level, position) DO UPDATE SET hash = $3, updated_at = NOW()`,
				level+1, parentPos, parentHash,
			)
			if err != nil {
				return err
			}
		} else {
			// Current node is right child; sibling is left
			siblingPos = leafIndex &^ (1 << uint(level))
			err = s.db.QueryRowContext(ctx,
				`SELECT hash FROM shadow_merkle_nodes WHERE level = $1 AND position = $2`,
				level, siblingPos,
			).Scan(&siblingHash)
			if err == sql.ErrNoRows {
				siblingHash = zeros[level][:]
			} else if err != nil {
				return err
			}
			// Parent = hash(sibling || current)
			parentHash := mimcHash(append(siblingHash, currentHash...))
			parentPos := leafIndex >> uint(level+1)
			currentHash = parentHash
			_, err = s.db.ExecContext(ctx,
				`INSERT INTO shadow_merkle_nodes (level + 1, position, hash) VALUES ($1, $2, $3)
				 ON CONFLICT (level, position) DO UPDATE SET hash = $3, updated_at = NOW()`,
				level+1, parentPos, parentHash,
			)
			if err != nil {
				return err
			}
		}
	}

	// Update the root and next index
	_, err = s.db.ExecContext(ctx,
		`UPDATE shadow_merkle_state SET root = $1, next_index = $2, updated_at = NOW() WHERE id = 1`,
		currentHash, leafIndex+1,
	)
	if err != nil {
		return err
	}

	s.logger.WithField("leaf_index", leafIndex).Info("Shadow Merkle tree updated")
	return nil
}

// GetClient returns the underlying chain client for use by the event listener.
func (s *Service) GetClient() *Client {
	return s.client
}

// GetLicenseRegistry returns the LicenseRegistry binding for the event listener.
func (s *Service) GetLicenseRegistry() *bindings.LicenseRegistry {
	return s.license
}

// --- Database helpers for event sync ---

// GetLastSyncedBlock returns the last processed block for a given contract.
func (s *Service) GetLastSyncedBlock(ctx context.Context, contractID string) (int64, error) {
	var lastBlock int64
	err := s.db.QueryRowContext(ctx,
		`SELECT last_block FROM chain_event_sync WHERE id = $1`,
		contractID,
	).Scan(&lastBlock)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return lastBlock, err
}

// UpdateSyncedBlock updates the last processed block for a given contract.
func (s *Service) UpdateSyncedBlock(ctx context.Context, contractID string, blockNum int64) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE chain_event_sync SET last_block = $1, updated_at = NOW() WHERE id = $2`,
		blockNum, contractID,
	)
	return err
}

// GetLicenseLeafByKeccak looks up a license leaf by its on-chain keccak256 hash.
func (s *Service) GetLicenseLeafByKeccak(ctx context.Context, leafHash [32]byte) (*LicenseLeaf, error) {
	var leaf LicenseLeaf
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, licence_number, keccak256_leaf, miMC_leaf, leaf_index, on_chain_root, issued_at, synced_at
		 FROM license_leaves WHERE keccak256_leaf = $1`,
		leafHash[:],
	).Scan(
		&leaf.ID, &leaf.UserID, &leaf.LicenceNumber,
		&leaf.Keccak256Leaf, &leaf.MiMCLeaf, &leaf.LeafIndex, &leaf.OnChainRoot,
		&leaf.IssuedAt, &leaf.SyncedAt,
	)
	if err != nil {
		return nil, err
	}
	return &leaf, nil
}
