// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PlatformAccessControl} from "./PlatformAccessControl.sol";

/// @title LicenseRegistry
/// @notice Append-only incremental Merkle tree of every license the
///         Admin Portal has issued. Each `issueLicense` call is triggered
///         by an admin clicking "Issue License" in the app — the Go
///         backend computes the leaf hash and submits the transaction via
///         the platform's KMS signer. Drivers never interact with this
///         contract; when they upload an existing license, the backend
///         checks their document's leaf hash for inclusion against
///         `root` and auto-verifies on a match, no manual review needed.
contract LicenseRegistry is PlatformAccessControl {
    uint8 public constant TREE_DEPTH = 20; // supports up to 2^20 (~1.05M) licenses

    bytes32 public root;
    uint256 public nextLeafIndex;

    bytes32[TREE_DEPTH] internal filledSubtrees;
    bytes32[TREE_DEPTH] internal zeros;

    mapping(bytes32 => bool) public isIssued; // leafHash => issued
    mapping(bytes32 => uint256) public leafIndexOf; // leafHash => index in tree

    event LicenseIssued(
        bytes32 indexed leafHash,
        uint256 indexed leafIndex,
        bytes32 newRoot
    );

    error TreeFull();
    error AlreadyIssued();

    constructor(
        address _platformSigner,
        address _guardian
    ) PlatformAccessControl(_platformSigner, _guardian) {
        bytes32 currentZero = keccak256(abi.encodePacked(uint256(0)));
        for (uint8 i = 0; i < TREE_DEPTH; i++) {
            zeros[i] = currentZero;
            filledSubtrees[i] = currentZero;
            currentZero = keccak256(abi.encodePacked(currentZero, currentZero));
        }
        root = currentZero;
    }

    /// @notice Issue a new license into the registry.
    /// @param leafHash keccak256(licenceNumber, holderIdentityCommitment, category, issueDate, expiryDate)
    ///        — computed by the Go backend from the authoritative license record. Never contains
    ///        raw PII on-chain, only the hash.
    function issueLicense(
        bytes32 leafHash
    ) external onlyPlatform returns (uint256 leafIndex) {
        if (nextLeafIndex >= 2 ** TREE_DEPTH) revert TreeFull();
        if (isIssued[leafHash]) revert AlreadyIssued();

        leafIndex = nextLeafIndex;
        uint256 currentIndex = leafIndex;
        bytes32 currentHash = leafHash;

        for (uint8 i = 0; i < TREE_DEPTH; i++) {
            if (currentIndex % 2 == 0) {
                filledSubtrees[i] = currentHash;
                currentHash = keccak256(
                    abi.encodePacked(currentHash, zeros[i])
                );
            } else {
                currentHash = keccak256(
                    abi.encodePacked(filledSubtrees[i], currentHash)
                );
            }
            currentIndex /= 2;
        }

        root = currentHash;
        nextLeafIndex += 1;
        isIssued[leafHash] = true;
        leafIndexOf[leafHash] = leafIndex;

        emit LicenseIssued(leafHash, leafIndex, root);
    }

    /// @notice Verify a leaf's inclusion against the *current* root.
    ///         Officers' apps or the Go backend can call this directly,
    ///         or verify the same proof entirely off-chain against a
    ///         cached root — both are valid, this is provided for
    ///         convenience and for offline-capable clients that sync
    ///         `root` periodically.
    function verifyInclusion(
        bytes32 leafHash,
        bytes32[TREE_DEPTH] calldata proofSiblings,
        uint256 leafIndex
    ) external view returns (bool) {
        bytes32 computedHash = leafHash;
        uint256 currentIndex = leafIndex;

        for (uint8 i = 0; i < TREE_DEPTH; i++) {
            if (currentIndex % 2 == 0) {
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proofSiblings[i])
                );
            } else {
                computedHash = keccak256(
                    abi.encodePacked(proofSiblings[i], computedHash)
                );
            }
            currentIndex /= 2;
        }

        return computedHash == root;
    }

    function getRoot() external view returns (bytes32) {
        return root;
    }
}
