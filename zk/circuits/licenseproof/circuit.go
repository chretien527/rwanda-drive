// Package licenseproof defines the zkSNARK circuit an officer's app (via
// the Go backend, per the Web2.5 model — the driver's device never runs
// this) uses to prove:
//
//	"I hold a license leaf included in the tree with root R,
//	 its category is >= the required category,
//	 and its expiry date is after the current timestamp"
//
// without revealing the licence number, the holder's identity
// commitment, the exact category, or the exact expiry date to whoever
// checks the proof (an officer's app, or the on-chain verifier).
package licenseproof

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/hash/mimc"

	"github.com/cipherpass/zk/gadgets/merkle"
)

// Circuit is the gnark circuit definition. Fields tagged `secret` are
// private witness values the prover (the backend, on the driver's
// behalf) knows but never reveals. Fields tagged `public` are known to
// everyone who checks the proof — including, eventually, the on-chain
// verifier contract.
type Circuit struct {
	// --- Private witness: the actual license record, never revealed ---
	LicenceNumber            frontend.Variable                  `gnark:",secret"`
	HolderIdentityCommitment frontend.Variable                  `gnark:",secret"`
	Category                 frontend.Variable                  `gnark:",secret"`
	ExpiryDate                frontend.Variable                  `gnark:",secret"`
	Siblings                 [merkle.TreeDepth]frontend.Variable `gnark:",secret"`
	PathBits                 [merkle.TreeDepth]frontend.Variable `gnark:",secret"`

	// --- Public inputs: what the verifier is told and checks against ---
	Root              frontend.Variable `gnark:",public"`
	RequiredCategory  frontend.Variable `gnark:",public"`
	CurrentTimestamp  frontend.Variable `gnark:",public"`
}

// Define constrains the circuit — this is where "what makes a proof valid" lives.
func (c *Circuit) Define(api frontend.API) error {
	// 1. Compute the leaf hash from the private preimage, using the
	//    SNARK-friendly MiMC hash (not keccak256 — see the note in
	//    gadgets/merkle/merkle.go on why the ZK-side leaf hash differs
	//    from LicenseRegistry.sol's on-chain keccak256 leaf hash; the
	//    Go backend maintains both hashes for the same record).
	hasher, err := mimc.NewMiMC(api)
	if err != nil {
		return err
	}
	hasher.Write(c.LicenceNumber, c.HolderIdentityCommitment, c.Category, c.ExpiryDate)
	leaf := hasher.Sum()

	// 2. Prove that leaf is included in the tree with the public root.
	if err := merkle.VerifyInclusionMiMC(api, leaf, c.Siblings, c.PathBits, c.Root); err != nil {
		return err
	}

	// 3. Prove category >= requiredCategory, without revealing Category itself.
	api.AssertIsLessOrEqual(c.RequiredCategory, c.Category)

	// 4. Prove expiryDate > currentTimestamp (strictly), without revealing ExpiryDate itself.
	oneAfterNow := api.Add(c.CurrentTimestamp, 1)
	api.AssertIsLessOrEqual(oneAfterNow, c.ExpiryDate)

	return nil
}