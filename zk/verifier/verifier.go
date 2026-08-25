// Package verifier checks license-proof zkSNARK proofs locally — used
// for testing and the backend's own sanity checks. The on-chain path
// (an officer's app checking a proof against LicenseProofVerifier.sol)
// is a separate contract call, generated from the same verifying key by
// export_solidity.go, so both paths agree by construction.
package verifier

import (
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/backend/witness"
)

// Verify checks proof against publicWitness using vk.
func Verify(vk groth16.VerifyingKey, proof groth16.Proof, publicWitness witness.Witness) error {
	return groth16.Verify(proof, vk, publicWitness)
}