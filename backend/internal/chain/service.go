package chain

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"fmt"
	"math/big"

	"github.com/0xEmmyb2/CipherPass/internal/config"
	"github.com/0xEmmyb2/CipherPass/pkg/bindings"
	"github.com/0xEmmyb2/CipherPass/pkg/database"
	"github.com/consensys/gnark-crypto/ecc"
	gcmimc "github.com/consensys/gnark-crypto/ecc/bn254/fr/mimc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/backend/witness"
	"github.com/consensys/gnark/constraint"
	"github.com/consensys/gnark/frontend"
	"github.com/ethereum/go-ethereum/common"
	"github.com/google/uuid"
	"github.com/cipherpass/zk/circuits/licenseproof"
	"github.com/cipherpass/zk/gadgets/merkle"
	"github.com/cipherpass/zk/prover"
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

// GetLicenseLeafByUserID looks up a license leaf by user ID.
func (s *Service) GetLicenseLeafByUserID(ctx context.Context, userID UUID) (*LicenseLeaf, error) {
	var leaf LicenseLeaf
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, licence_number, keccak256_leaf, miMC_leaf, leaf_index, on_chain_root, issued_at, synced_at
		 FROM license_leaves WHERE user_id = $1`,
		userID,
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

// getHolderIdentityCommitment returns the holder identity commitment for a user.
// This is a zero-knowledge friendly commitment to the user's identity data.
func (s *Service) getHolderIdentityCommitment(userID UUID) (string, error) {
	// TODO: Replace with actual implementation that retrieves or computes
	// the holder identity commitment from verified user data (biometrics, documents)
	// For now, return a deterministic placeholder based on userID
	hash := sha256.Sum256(append([]byte("holder-identity-commitment:"), userID[:]...))
	return fmt.Sprintf("%x", hash), nil
}

// getLicenseCategory returns the license category for a user.
// This represents the type/class of license (e.g., 1=motorcycle, 2=car, 3=truck).
func (s *Service) getLicenseCategory(userID UUID) (int64, error) {
	// TODO: Replace with actual implementation that retrieves the license category
	// from user data or license records
	// For now, return a default category (e.g., 2 for car)
	return 2, nil
}

// calculateExpiryDate calculates the expiry date based on the issued date.
// Assumes a fixed validity period (e.g., 5 years).
func (s *Service) calculateExpiryDate(issuedAt time.Time) (int64, error) {
	// TODO: Replace with actual validity period logic (may depend on license category, jurisdiction, etc.)
	// For now, assume 5 years validity
	validityPeriod := 5 * 365 * 24 * 60 * 60 // 5 years in seconds
	return issuedAt.Unix() + validityPeriod, nil
}

// GenerateLicenseVerificationProof generates a ZK proof proving that a user's license
// is valid and meets the specified requirements, without revealing the underlying license data.
// This is used when a driver presents their QR code for license verification.
func (s *Service) GenerateLicenseVerificationProof(ctx context.Context, userID UUID, requiredCategory int64, currentTimestamp int64) (*groth16.Proof, witness.Witness, error) {
	// 1. Get the license leaf for the user
	leaf, err := s.GetLicenseLeafByUserID(ctx, userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get license leaf for user %s: %w", userID, err)
	}

	// 2. Get the holder identity commitment
	holderIdentityCommitmentStr, err := s.getHolderIdentityCommitment(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get holder identity commitment: %w", err)
	}
	// Convert hex string to int64 (assuming it fits in int64 for simplicity)
	// In a real implementation, this would be a proper byte array conversion
	holderIdentityCommitment := new(big.Int).SetBytes(common.FromHex(holderIdentityCommitmentStr)).Int64()

	// 3. Get the license category
	category, err := s.getLicenseCategory(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get license category: %w", err)
	}

	// 4. Calculate the expiry date
	expiryDate, err := s.calculateExpiryDate(leaf.IssuedAt)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to calculate expiry date: %w", err)
	}

	// 5. Build the license record
	// Convert string fields to int64 for the proof system
	// In a real implementation, these would already be numeric or properly encoded
	licenceNumberInt := new(big.Int).SetBytes(sha256.Sum256([]byte(leaf.LicenceNumber))).Int64()
	record := LicenseRecord{
		LicenceNumber:            licenceNumberInt,
		HolderIdentityCommitment: holderIdentityCommitment,
		Category:                 category,
		IssueDate:                leaf.IssuedAt.Unix(),
		ExpiryDate:               expiryDate,
	}

	// 6. Get the current Merkle root from the LicenseRegistry contract
	rootBytes, err := s.GetShadowTreeRoot(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get shadow tree root: %w", err)
	}
	root := new(big.Int).SetBytes(rootBytes)

	// 7. Get the Merkle path (siblings) from the shadow Merkle tree
	if leaf.LeafIndex == nil {
		return nil, nil, fmt.Errorf("license leaf index not available (license not yet confirmed on-chain)")
	}
	siblingsBytes, err := s.GetShadowTreeSiblings(ctx, *leaf.LeafIndex)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get shadow tree siblings: %w", err)
	}

	// Convert siblings from [][]byte to []*big.Int
	var siblings [merkle.TreeDepth]*big.Int
	for i, sibBytes := range siblingsBytes {
		siblings[i] = new(big.Int).SetBytes(sibBytes)
	}

	// 8. Compute the path bits from the leaf index
	var pathBits [merkle.TreeDepth]int
	leafIndex := *leaf.LeafIndex
	for i := 0; i < merkle.TreeDepth; i++ {
		pathBits[i] = (int(leafIndex >> uint(i)) & 1)
	}

	// 9. Build the Merkle path
	path := MerklePath{
		Root:     root,
		Siblings: siblings,
		PathBits: pathBits,
	}

	// 10. Get the proving key for the licenseproof circuit
	// In a real implementation, this would be loaded from secure storage
	// For now, we'll need to compile the circuit and get the proving key
	// This is a simplified placeholder - in practice, you'd cache the proving key
	var licenseproofCircuit licenseproof.Circuit
	ccs, err := frontend.Compile(ecc.BN254.ScalarField(), frontend.R1CS, &licenseproofCircuit)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to compile licenseproof circuit: %w", err)
	}
	pk, err := groth16.Setup(ccs)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to setup proving key: %w", err)
	}

	// 11. Create the request
	req := Request{
		Record:           record,
		Path:             path,
		RequiredCategory: requiredCategory,
		CurrentTimestamp: currentTimestamp,
	}

	// 12. Generate the proof
	proof, publicWitness, err := prover.GenerateProof(ccs, pk, req)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate proof: %w", err)
	}

	return proof, publicWitness, nil
}
