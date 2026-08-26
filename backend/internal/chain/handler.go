package chain

import (
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/0xEmmyb2/CipherPass/internal/auth"
	"github.com/0xEmmyb2/CipherPass/internal/config"
	"github.com/gorilla/mux"
)

// Handler provides HTTP endpoints for admin chain operations.
type Handler struct {
	service *Service
	logger  config.LoggerInterface
}

// NewHandler creates a new chain admin handler.
func NewHandler(service *Service, logger config.LoggerInterface) *Handler {
	return &Handler{
		service: service,
		logger:  logger,
	}
}

// RegisterRoutes adds admin-only chain routes to the router.
// All routes require SUPER_ADMIN role.
func (h *Handler) RegisterRoutes(r *mux.Router, authMiddleware *auth.Middleware) {
	adminRouter := r.PathPrefix("/api/v1/admin").Subrouter()
	adminRouter.Use(authMiddleware.Authenticate)
	adminRouter.Use(authMiddleware.RequireRole(auth.RoleSuperAdmin))

	adminRouter.HandleFunc("/issue-license", h.HandleIssueLicense).Methods("POST")
	adminRouter.HandleFunc("/licenses", h.HandleListLicenses).Methods("GET")
	adminRouter.HandleFunc("/licenses/{leaf_hash}", h.HandleGetLicense).Methods("GET")
	adminRouter.HandleFunc("/shadow-tree/root", h.HandleGetShadowTreeRoot).Methods("GET")
	adminRouter.HandleFunc("/chain/sync-status", h.HandleGetSyncStatus).Methods("GET")
	adminRouter.HandleFunc("/chain/credential-status/{credential_hash}", h.HandleCheckCredentialStatus).Methods("GET")
}

// --- Request/Response types ---

type issueLicenseRequest struct {
	UserID                    string `json:"user_id"`
	LicenceNumber             string `json:"licence_number"`
	HolderIdentityCommitment  string `json:"holder_identity_commitment"`
	Category                  int64  `json:"category"`
	IssueDate                 int64  `json:"issue_date"`  // Unix timestamp
	ExpiryDate                int64  `json:"expiry_date"` // Unix timestamp
}

type issueLicenseResponse struct {
	Keccak256Leaf string `json:"keccak256_leaf"`
	MiMCLeaf      string `json:"mimc_leaf"`
	TxHash        string `json:"tx_hash"`
	Message       string `json:"message"`
}

type licenseLeafResponse struct {
	ID            string  `json:"id"`
	UserID        string  `json:"user_id"`
	LicenceNumber string  `json:"licence_number"`
	Keccak256Leaf string  `json:"keccak256_leaf"`
	MiMCLeaf      string  `json:"mimc_leaf"`
	LeafIndex     *int64  `json:"leaf_index,omitempty"`
	OnChainRoot   *string `json:"on_chain_root,omitempty"`
	IssuedAt      string  `json:"issued_at"`
	SyncedAt      *string `json:"synced_at,omitempty"`
	OnChain       bool    `json:"on_chain"`
}

type credentialStatusResponse struct {
	CredentialHash string `json:"credential_hash"`
	Status         string `json:"status"`
	StatusCode     uint8  `json:"status_code"`
}

// --- Handlers ---

// HandleIssueLicense issues a new license on-chain and stores the dual-hash.
func (h *Handler) HandleIssueLicense(w http.ResponseWriter, r *http.Request) {
	var req issueLicenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body", "BAD_REQUEST")
		return
	}

	// Validate required fields
	if req.UserID == "" || req.LicenceNumber == "" {
		writeError(w, http.StatusBadRequest, "user_id and licence_number are required", "BAD_REQUEST")
		return
	}
	if req.HolderIdentityCommitment == "" {
		writeError(w, http.StatusBadRequest, "holder_identity_commitment is required", "BAD_REQUEST")
		return
	}
	if req.Category <= 0 {
		writeError(w, http.StatusBadRequest, "category must be a positive integer", "BAD_REQUEST")
		return
	}
	if req.IssueDate == 0 || req.ExpiryDate == 0 {
		writeError(w, http.StatusBadRequest, "issue_date and expiry_date are required (unix timestamps)", "BAD_REQUEST")
		return
	}
	if req.ExpiryDate <= req.IssueDate {
		writeError(w, http.StatusBadRequest, "expiry_date must be after issue_date", "BAD_REQUEST")
		return
	}

	record := LicenseRecord{
		LicenceNumber:             req.LicenceNumber,
		HolderIdentityCommitment:  req.HolderIdentityCommitment,
		Category:                  req.Category,
		IssueDate:                 req.IssueDate,
		ExpiryDate:                req.ExpiryDate,
	}

	result, err := h.service.IssueLicense(r.Context(), req.UserID, record)
	if err != nil {
		h.logger.WithError(err).Error("Failed to issue license")
		writeError(w, http.StatusInternalServerError, "failed to issue license on-chain", "CHAIN_ISSUE_FAILED")
		return
	}

	adminID := auth.GetUserID(r.Context())
	h.logger.WithFields(map[string]interface{}{
		"admin_id":      adminID,
		"user_id":       req.UserID,
		"licence":       req.LicenceNumber,
		"tx_hash":       result.TxHash,
	}).Info("License issued by admin")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(issueLicenseResponse{
		Keccak256Leaf: hex.EncodeToString(result.Keccak256Leaf[:]),
		MiMCLeaf:      hex.EncodeToString(result.MiMCLeaf),
		TxHash:        result.TxHash,
		Message:       "License issued on-chain. Waiting for confirmation — event listener will sync status.",
	})
}

// HandleListLicenses returns all license leaves with their sync status.
func (h *Handler) HandleListLicenses(w http.ResponseWriter, r *http.Request) {
	// Parse pagination params
	limit := 50
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	rows, err := h.service.db.QueryContext(r.Context(),
		`SELECT id, user_id, licence_number, keccak256_leaf, miMC_leaf, leaf_index, on_chain_root, issued_at, synced_at
		 FROM license_leaves ORDER BY issued_at DESC LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		h.logger.WithError(err).Error("Failed to list license leaves")
		writeError(w, http.StatusInternalServerError, "failed to list licenses", "INTERNAL_ERROR")
		return
	}
	defer rows.Close()

	var licenses []licenseLeafResponse
	for rows.Next() {
		var leaf LicenseLeaf
		err := rows.Scan(
			&leaf.ID, &leaf.UserID, &leaf.LicenceNumber,
			&leaf.Keccak256Leaf, &leaf.MiMCLeaf, &leaf.LeafIndex, &leaf.OnChainRoot,
			&leaf.IssuedAt, &leaf.SyncedAt,
		)
		if err != nil {
			h.logger.WithError(err).Error("Failed to scan license leaf")
			continue
		}

		issuedAt := leaf.IssuedAt.Format(time.RFC3339)
		resp := licenseLeafResponse{
			ID:            leaf.ID.String(),
			UserID:        leaf.UserID.String(),
			LicenceNumber: leaf.LicenceNumber,
			Keccak256Leaf: hex.EncodeToString(leaf.Keccak256Leaf),
			MiMCLeaf:      hex.EncodeToString(leaf.MiMCLeaf),
			IssuedAt:      issuedAt,
			OnChain:       leaf.LeafIndex != nil,
		}
		if leaf.LeafIndex != nil {
			resp.LeafIndex = leaf.LeafIndex
		}
		if leaf.OnChainRoot != nil {
			rootHex := hex.EncodeToString(leaf.OnChainRoot)
			resp.OnChainRoot = &rootHex
		}
		if leaf.SyncedAt != nil {
			synced := leaf.SyncedAt.Format(time.RFC3339)
			resp.SyncedAt = &synced
		}

		licenses = append(licenses, resp)
	}

	if licenses == nil {
		licenses = []licenseLeafResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"licenses": licenses,
		"count":    len(licenses),
		"limit":    limit,
		"offset":   offset,
	})
}

// HandleGetLicense returns a specific license leaf by its keccak256 hash.
func (h *Handler) HandleGetLicense(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	leafHashHex := vars["leaf_hash"]

	leafHashBytes, err := hex.DecodeString(leafHashHex)
	if err != nil || len(leafHashBytes) != 32 {
		writeError(w, http.StatusBadRequest, "invalid leaf hash (must be 64 hex characters)", "BAD_REQUEST")
		return
	}

	var leafHash [32]byte
	copy(leafHash[:], leafHashBytes)

	leaf, err := h.service.GetLicenseLeafByKeccak(r.Context(), leafHash)
	if err != nil {
		writeError(w, http.StatusNotFound, "license leaf not found", "NOT_FOUND")
		return
	}

	issuedAt := leaf.IssuedAt.Format(time.RFC3339)
	resp := licenseLeafResponse{
		ID:            leaf.ID.String(),
		UserID:        leaf.UserID.String(),
		LicenceNumber: leaf.LicenceNumber,
		Keccak256Leaf: hex.EncodeToString(leaf.Keccak256Leaf),
		MiMCLeaf:      hex.EncodeToString(leaf.MiMCLeaf),
		IssuedAt:      issuedAt,
		OnChain:       leaf.LeafIndex != nil,
	}
	if leaf.LeafIndex != nil {
		resp.LeafIndex = leaf.LeafIndex
	}
	if leaf.OnChainRoot != nil {
		rootHex := hex.EncodeToString(leaf.OnChainRoot)
		resp.OnChainRoot = &rootHex
	}
	if leaf.SyncedAt != nil {
		synced := leaf.SyncedAt.Format(time.RFC3339)
		resp.SyncedAt = &synced
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// HandleGetShadowTreeRoot returns the current root of the ZK shadow Merkle tree.
func (h *Handler) HandleGetShadowTreeRoot(w http.ResponseWriter, r *http.Request) {
	root, err := h.service.GetShadowTreeRoot(r.Context())
	if err != nil {
		h.logger.WithError(err).Error("Failed to get shadow tree root")
		writeError(w, http.StatusInternalServerError, "failed to get shadow tree root", "INTERNAL_ERROR")
		return
	}

	// Get next index for context
	var nextIndex int64
	_ = h.service.db.QueryRowContext(r.Context(),
		`SELECT next_index FROM shadow_merkle_state WHERE id = 1`,
	).Scan(&nextIndex)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"root":       hex.EncodeToString(root),
		"next_index": nextIndex,
		"tree_depth": TreeDepth,
	})
}

// HandleGetSyncStatus returns the current event sync status for all tracked contracts.
func (h *Handler) HandleGetSyncStatus(w http.ResponseWriter, r *http.Request) {
	type contractSync struct {
		Contract   string `json:"contract"`
		LastBlock  int64  `json:"last_block"`
	}

	contracts := []string{"LicenseRegistry", "CredentialRegistry", "AuditAnchor"}
	var results []contractSync

	for _, c := range contracts {
		lastBlock, err := h.service.GetLastSyncedBlock(r.Context(), c)
		if err != nil {
			lastBlock = 0
		}
		results = append(results, contractSync{
			Contract:  c,
			LastBlock: lastBlock,
		})
	}

	// Also get current chain block for context
	currentBlock, err := h.service.client.BlockNumber(r.Context())
	if err != nil {
		currentBlock = 0
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"sync_cursors":   results,
		"current_block":  currentBlock,
	})
}

// HandleCheckCredentialStatus checks the on-chain status of a credential.
func (h *Handler) HandleCheckCredentialStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	credHashHex := vars["credential_hash"]

	credHashBytes, err := hex.DecodeString(credHashHex)
	if err != nil || len(credHashBytes) != 32 {
		writeError(w, http.StatusBadRequest, "invalid credential hash (must be 64 hex characters)", "BAD_REQUEST")
		return
	}

	var credHash [32]byte
	copy(credHash[:], credHashBytes)

	status, err := h.service.CheckCredentialStatus(r.Context(), credHash)
	if err != nil {
		h.logger.WithError(err).Error("Failed to check credential status")
		writeError(w, http.StatusInternalServerError, "failed to check credential status", "CHAIN_QUERY_FAILED")
		return
	}

	statusName := "UNKNOWN"
	switch status {
	case StatusActive:
		statusName = "ACTIVE"
	case StatusRevoked:
		statusName = "REVOKED"
	case StatusSuspended:
		statusName = "SUSPENDED"
	case StatusNone:
		statusName = "NONE"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(credentialStatusResponse{
		CredentialHash: credHashHex,
		Status:         statusName,
		StatusCode:     uint8(status),
	})
}

// writeError sends a JSON error response.
func writeError(w http.ResponseWriter, status int, message, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
		"code":  code,
	})
}
