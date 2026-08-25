package licenseproof

import (
	"math/big"
	"testing"

	"github.com/consensys/gnark-crypto/ecc"
	gcmimc "github.com/consensys/gnark-crypto/ecc/bn254/fr/mimc"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/test"

	"github.com/cipherpass/zk/gadgets/merkle"
)

// mimcHash replicates, off-circuit, exactly what the in-circuit
// mimc.Write(a, b) + Sum() sequence computes, so test fixtures are
// consistent with what the circuit itself will check.
func mimcHash(inputs ...*big.Int) *big.Int {
	h := gcmimc.NewMiMC()
	for _, in := range inputs {
		buf := make([]byte, 32)
		in.FillBytes(buf)
		h.Write(buf)
	}
	sum := h.Sum(nil)
	return new(big.Int).SetBytes(sum)
}

// buildFixture constructs one leaf plus a full sibling path + path bits
// such that hashing the leaf up through the given path lands on the
// returned root.
func buildFixture(leaf *big.Int, leafIndex uint64) (root *big.Int, siblings [merkle.TreeDepth]*big.Int, pathBits [merkle.TreeDepth]int) {
	current := new(big.Int).Set(leaf)
	idx := leafIndex

	for i := 0; i < merkle.TreeDepth; i++ {
		sibling := big.NewInt(int64(1000 + i)) // arbitrary but deterministic
		siblings[i] = sibling

		if idx%2 == 0 {
			pathBits[i] = 0
			current = mimcHash(current, sibling)
		} else {
			pathBits[i] = 1
			current = mimcHash(sibling, current)
		}
		idx /= 2
	}

	return current, siblings, pathBits
}

func newWitness(
	licenceNumber, holderCommitment, category, expiry int64,
	requiredCategory, currentTimestamp int64,
	leafIndex uint64,
	corruptRoot bool,
) *Circuit {
	leaf := mimcHash(big.NewInt(licenceNumber), big.NewInt(holderCommitment), big.NewInt(category), big.NewInt(expiry))
	root, siblings, pathBits := buildFixture(leaf, leafIndex)

	if corruptRoot {
		root = new(big.Int).Add(root, big.NewInt(1))
	}

	w := &Circuit{
		LicenceNumber:            licenceNumber,
		HolderIdentityCommitment: holderCommitment,
		Category:                 category,
		ExpiryDate:               expiry,
		Root:                     root,
		RequiredCategory:         requiredCategory,
		CurrentTimestamp:         currentTimestamp,
	}
	for i := 0; i < merkle.TreeDepth; i++ {
		w.Siblings[i] = siblings[i]
		w.PathBits[i] = pathBits[i]
	}
	return w
}

func TestValidProofSolves(t *testing.T) {
	assert := test.NewAssert(t)
	circuit := &Circuit{}
	witness := newWitness(123456, 987654, 2, 2000000000, 2, 1900000000, 5, false)
	assert.CheckCircuit(circuit, test.WithValidAssignment(witness), test.WithCurves(ecc.BN254))
}

func TestTamperedRootFails(t *testing.T) {
	assert := test.NewAssert(t)
	circuit := &Circuit{}
	witness := newWitness(123456, 987654, 2, 2000000000, 2, 1900000000, 5, true)
	assert.CheckCircuit(circuit, test.WithInvalidAssignment(witness), test.WithCurves(ecc.BN254))
}

func TestExpiredLicenseFails(t *testing.T) {
	assert := test.NewAssert(t)
	circuit := &Circuit{}
	// currentTimestamp AFTER expiry — should fail the strict expiry check
	witness := newWitness(123456, 987654, 2, 1000000000, 2, 1900000000, 5, false)
	assert.CheckCircuit(circuit, test.WithInvalidAssignment(witness), test.WithCurves(ecc.BN254))
}

func TestInsufficientCategoryFails(t *testing.T) {
	assert := test.NewAssert(t)
	circuit := &Circuit{}
	// holder has category 1, but officer requires category 2 — should fail
	witness := newWitness(123456, 987654, 1, 2000000000, 2, 1900000000, 5, false)
	assert.CheckCircuit(circuit, test.WithInvalidAssignment(witness), test.WithCurves(ecc.BN254))
}

var _ frontend.Circuit = (*Circuit)(nil)