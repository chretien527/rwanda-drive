// Package prover generates license-proof zkSNARK proofs. This code runs
// INSIDE THE GO BACKEND, not on a driver's device — consistent with the
// Web2.5 model: the backend already holds the driver's license data from
// KYC/document verification, so it generates the proof on the driver's
// behalf when an officer's scan requests one. The driver never runs any
// ZK tooling themselves.
package prover

import (
	"math/big"

	"github.com/consensys/gnark-crypto/ecc"
	gcmimc "github.com/consensys/gnark-crypto/ecc/bn254/fr/mimc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/backend/witness"
	"github.com/consensys/gnark/constraint"
	"github.com/consensys/gnark/frontend"

	"github.com/cipherpass/zk/circuits/licenseproof"
	"github.com/cipherpass/zk/gadgets/merkle"
)

// LicenseRecord is the raw data the backend already holds for a driver's
// license (from the Postgres documents/document_verifications tables).
type LicenseRecord struct {
	LicenceNumber            int64
	HolderIdentityCommitment int64
	Category                 int64
	ExpiryDate                int64 // unix timestamp
}

// MerklePath is the sibling path + direction bits proving LicenseRecord's
// (MiMC) leaf is included in the tree with the given root — the backend
// computes this the same way LicenseRegistry.sol's incremental tree does.
type MerklePath struct {
	Root     *big.Int
	Siblings [merkle.TreeDepth]*big.Int
	PathBits [merkle.TreeDepth]int
}

// Request bundles everything needed to generate one proof.
type Request struct {
	Record           LicenseRecord
	Path             MerklePath
	RequiredCategory int64
	CurrentTimestamp int64
}

// LeafHash computes the MiMC leaf hash for a license record.
func LeafHash(r LicenseRecord) *big.Int {
	h := gcmimc.NewMiMC()
	for _, v := range []int64{r.LicenceNumber, r.HolderIdentityCommitment, r.Category, r.ExpiryDate} {
		buf := make([]byte, 32)
		big.NewInt(v).FillBytes(buf)
		h.Write(buf)
	}
	return new(big.Int).SetBytes(h.Sum(nil))
}

// GenerateProof builds the witness from req and produces a Groth16 proof
// plus the public witness (needed alongside the proof for verification).
func GenerateProof(ccs constraint.ConstraintSystem, pk groth16.ProvingKey, req Request) (groth16.Proof, witness.Witness, error) {
	assignment := &licenseproof.Circuit{
		LicenceNumber:            req.Record.LicenceNumber,
		HolderIdentityCommitment: req.Record.HolderIdentityCommitment,
		Category:                 req.Record.Category,
		ExpiryDate:                req.Record.ExpiryDate,
		Root:                     req.Path.Root,
		RequiredCategory:         req.RequiredCategory,
		CurrentTimestamp:         req.CurrentTimestamp,
	}
	for i := 0; i < merkle.TreeDepth; i++ {
		assignment.Siblings[i] = req.Path.Siblings[i]
		assignment.PathBits[i] = req.Path.PathBits[i]
	}

	fullWitness, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		return nil, nil, err
	}

	proof, err := groth16.Prove(ccs, pk, fullWitness)
	if err != nil {
		return nil, nil, err
	}

	publicWitness, err := fullWitness.Public()
	if err != nil {
		return nil, nil, err
	}

	return proof, publicWitness, nil
}