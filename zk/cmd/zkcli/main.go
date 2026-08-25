// zkcli is a small command-line tool for exercising the license-proof
// circuit locally — run the trusted setup, generate a sample proof,
// verify it, and export the Solidity verifier — before wiring the same
// setup/prover/verifier packages into the main backend's /internal/zk
// package.
//
// Usage:
//   zkcli setup    ./keys
//   zkcli prove    ./keys ./proof.bin ./public.bin
//   zkcli verify   ./keys ./proof.bin ./public.bin
//   zkcli export   ./keys ./LicenseProofVerifier.sol
package main

import (
	"fmt"
	"io"
	"math/big"
	"os"

	"github.com/consensys/gnark-crypto/ecc"
	gcmimc "github.com/consensys/gnark-crypto/ecc/bn254/fr/mimc"
	"github.com/consensys/gnark/backend/groth16"
	gwitness "github.com/consensys/gnark/backend/witness"

	"github.com/cipherpass/zk/gadgets/merkle"
	"github.com/cipherpass/zk/prover"
	"github.com/cipherpass/zk/setup"
	"github.com/cipherpass/zk/verifier"
)

func main() {
	if len(os.Args) < 3 {
		usage()
		os.Exit(1)
	}

	cmd := os.Args[1]
	keysDir := os.Args[2]

	switch cmd {
	case "setup":
		runSetup(keysDir)
	case "prove":
		if len(os.Args) < 5 {
			usage()
			os.Exit(1)
		}
		runProve(keysDir, os.Args[3], os.Args[4])
	case "verify":
		if len(os.Args) < 5 {
			usage()
			os.Exit(1)
		}
		runVerify(keysDir, os.Args[3], os.Args[4])
	case "export":
		if len(os.Args) < 4 {
			usage()
			os.Exit(1)
		}
		runExport(keysDir, os.Args[3])
	default:
		usage()
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: zkcli <setup|prove|verify|export> <keysDir> [args...]")
}

func runSetup(keysDir string) {
	artifacts, err := setup.Run()
	must(err)
	must(artifacts.SaveToDir(keysDir))
	fmt.Println("setup complete, keys written to", keysDir)
}

// sampleRequest builds a demo proof request with a self-consistent
// Merkle path for local CLI testing. Real backend usage replaces this
// with an actual license record and a real path from the shadow Merkle
// tree the backend maintains alongside LicenseRegistry.sol.
func sampleRequest() prover.Request {
	record := prover.LicenseRecord{
		LicenceNumber:            123456,
		HolderIdentityCommitment: 987654,
		Category:                 2,
		ExpiryDate:                2000000000,
	}

	leaf := prover.LeafHash(record)

	var siblings [merkle.TreeDepth]*big.Int
	var pathBits [merkle.TreeDepth]int
	current := new(big.Int).Set(leaf)

	for i := 0; i < merkle.TreeDepth; i++ {
		sibling := big.NewInt(int64(1000 + i))
		siblings[i] = sibling
		pathBits[i] = 0
		current = mimcCombine(current, sibling)
	}

	return prover.Request{
		Record: record,
		Path: prover.MerklePath{
			Root:     current,
			Siblings: siblings,
			PathBits: pathBits,
		},
		RequiredCategory: 2,
		CurrentTimestamp: 1900000000,
	}
}

func runProve(keysDir, proofOut, publicOut string) {
	artifacts, err := setup.LoadFromDir(keysDir)
	must(err)

	req := sampleRequest()

	proof, publicWitness, err := prover.GenerateProof(artifacts.CCS, artifacts.PK, req)
	must(err)

	must(writeBinary(proofOut, proof))
	pubBytes, err := publicWitness.MarshalBinary()
	must(err)
	must(os.WriteFile(publicOut, pubBytes, 0o640))

	fmt.Println("proof written to", proofOut)
	fmt.Println("public witness written to", publicOut)
}

func runVerify(keysDir, proofIn, publicIn string) {
	artifacts, err := setup.LoadFromDir(keysDir)
	must(err)

	proof := groth16Proof()
	must(readBinary(proofIn, proof))

	pubBytes, err := os.ReadFile(publicIn)
	must(err)
	publicWitness := groth16Witness()
	must(publicWitness.UnmarshalBinary(pubBytes))

	err = verifier.Verify(artifacts.VK, proof, publicWitness)
	if err != nil {
		fmt.Println("INVALID:", err)
		os.Exit(1)
	}
	fmt.Println("VALID")
}

func runExport(keysDir, outPath string) {
	artifacts, err := setup.LoadFromDir(keysDir)
	must(err)
	must(verifier.ExportSolidity(artifacts.VK, outPath))
	fmt.Println("Solidity verifier written to", outPath)
}

func mimcCombine(a, b *big.Int) *big.Int {
	h := gcmimc.NewMiMC()
	for _, v := range []*big.Int{a, b} {
		buf := make([]byte, 32)
		v.FillBytes(buf)
		h.Write(buf)
	}
	return new(big.Int).SetBytes(h.Sum(nil))
}

func writeBinary(path string, obj interface{ WriteTo(w io.Writer) (int64, error) }) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = obj.WriteTo(f)
	return err
}

func readBinary(path string, obj interface{ ReadFrom(r io.Reader) (int64, error) }) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = obj.ReadFrom(f)
	return err
}

func groth16Proof() groth16.Proof { return groth16.NewProof(ecc.BN254) }

func groth16Witness() gwitness.Witness {
	w, err := gwitness.New(ecc.BN254.ScalarField())
	must(err)
	return w
}

func must(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}