// Package merkle provides a Merkle inclusion-proof gadget for use inside
// gnark circuits. The tree shape here MUST match LicenseRegistry.sol
// exactly: same depth, same "left sibling at even index, right sibling at
// odd index" convention. If these two ever drift, proofs generated
// against the on-chain root will fail to verify — or worse, verify
// incorrectly.
package merkle

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/hash/mimc"
)

// TreeDepth mirrors LicenseRegistry.sol's TREE_DEPTH constant.
// LicenseRegistry.sol uses keccak256 on-chain (cheap in the EVM); inside
// a SNARK circuit, keccak256 is expensive to constrain, so the circuit
// side uses a SNARK-friendly hash (MiMC) instead. This means the leaf
// hash used for the ZK proof is NOT the same value as the on-chain
// keccak256 leaf hash — see the note in circuit.go's Define() about how
// the two are reconciled.
const TreeDepth = 20

// VerifyInclusionMiMC constrains that `leaf`, combined with `siblings`
// and `pathBits` (0 = leaf is left child, 1 = leaf is right child at that
// level), hashes up to `root` using MiMC at each level.
func VerifyInclusionMiMC(
	api frontend.API,
	leaf frontend.Variable,
	siblings [TreeDepth]frontend.Variable,
	pathBits [TreeDepth]frontend.Variable,
	root frontend.Variable,
) error {
	hasher, err := mimc.NewMiMC(api)
	if err != nil {
		return err
	}

	current := leaf

	for i := 0; i < TreeDepth; i++ {
		// pathBits[i] must be boolean (0 or 1) — enforce it explicitly
		// rather than trusting the witness, since an unconstrained bit
		// would let a malicious prover pick whichever order makes an
		// invalid leaf hash up to a valid root.
		api.AssertIsBoolean(pathBits[i])

		left := api.Select(pathBits[i], siblings[i], current)
		right := api.Select(pathBits[i], current, siblings[i])

		hasher.Reset()
		hasher.Write(left, right)
		current = hasher.Sum()
	}

	api.AssertIsEqual(current, root)
	return nil
}