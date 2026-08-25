// Package setup performs the Groth16 trusted setup for the license-proof
// circuit: compiles the circuit into a constraint system (R1CS), then
// generates the proving key (pk) and verifying key (vk).
//
// Run this ONCE per circuit version, offline, not per-proof. The pk and
// vk it produces are then reused for every proof/verification going
// forward — see prover/prover.go and verifier/verifier.go.
//
// Security note: for a real production deployment, Groth16's setup
// should be run as a proper multi-party trusted-setup ceremony (or
// switched to PLONK, which uses a universal setup and avoids a
// per-circuit ceremony). The single-process setup here is fine for
// development and testnet; do not treat its output as production-grade
// until that's addressed.
package setup

import (
	"io"
	"os"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/constraint"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"

	"github.com/cipherpass/zk/circuits/licenseproof"
)

// Artifacts bundles everything produced by a setup run.
type Artifacts struct {
	CCS constraint.ConstraintSystem
	PK  groth16.ProvingKey
	VK  groth16.VerifyingKey
}

// Run compiles the license-proof circuit and generates a fresh pk/vk pair.
func Run() (*Artifacts, error) {
	circuit := &licenseproof.Circuit{}

	ccs, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		return nil, err
	}

	pk, vk, err := groth16.Setup(ccs)
	if err != nil {
		return nil, err
	}

	return &Artifacts{CCS: ccs, PK: pk, VK: vk}, nil
}

// SaveToDir writes ccs, pk, and vk to the given directory as
// "circuit.ccs", "proving.key", "verifying.key". The proving key MUST be
// handled like a secret in any real deployment — see keys/README.md.
func (a *Artifacts) SaveToDir(dir string) error {
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return err
	}
	if err := writeTo(dir+"/circuit.ccs", a.CCS); err != nil {
		return err
	}
	if err := writeTo(dir+"/proving.key", a.PK); err != nil {
		return err
	}
	if err := writeTo(dir+"/verifying.key", a.VK); err != nil {
		return err
	}
	return nil
}

// LoadFromDir reads back what SaveToDir wrote.
func LoadFromDir(dir string) (*Artifacts, error) {
	ccs := groth16.NewCS(ecc.BN254)
	pk := groth16.NewProvingKey(ecc.BN254)
	vk := groth16.NewVerifyingKey(ecc.BN254)

	if err := readFrom(dir+"/circuit.ccs", ccs); err != nil {
		return nil, err
	}
	if err := readFrom(dir+"/proving.key", pk); err != nil {
		return nil, err
	}
	if err := readFrom(dir+"/verifying.key", vk); err != nil {
		return nil, err
	}

	return &Artifacts{CCS: ccs, PK: pk, VK: vk}, nil
}

type writerTo interface {
	WriteTo(w io.Writer) (int64, error)
}

type readerFrom interface {
	ReadFrom(r io.Reader) (int64, error)
}

func writeTo(path string, obj writerTo) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = obj.WriteTo(f)
	return err
}

func readFrom(path string, obj readerFrom) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = obj.ReadFrom(f)
	return err
}