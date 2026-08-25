// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PlatformAccessControl} from "./PlatformAccessControl.sol";

/// @title AuditAnchor
/// @notice Tamper-evidence for the platform's audit log. The Go backend
///         batches audit log entries stored in Postgres (hourly/daily),
///         computes a Merkle root over that batch, and anchors just the
///         root here — full log entries (which may reference sensitive
///         context) never leave Postgres. Anyone with a specific log
///         entry and its Merkle proof can later verify it was included
///         in a batch anchored at a given time, which means not even a
///         compromised admin account can silently rewrite history
///         without the tampering being detectable.
contract AuditAnchor is PlatformAccessControl {
    mapping(uint256 => bytes32) public batchRoots; // batchId => merkleRoot
    mapping(uint256 => uint256) public batchTimestamp; // batchId => block.timestamp when anchored
    uint256 public latestBatchId;

    event BatchAnchored(
        uint256 indexed batchId,
        bytes32 merkleRoot,
        uint256 timestamp
    );

    error BatchAlreadyAnchored();

    constructor(
        address _platformSigner,
        address _guardian
    ) PlatformAccessControl(_platformSigner, _guardian) {}

    function anchorBatch(
        uint256 batchId,
        bytes32 merkleRoot
    ) external onlyPlatform {
        if (batchRoots[batchId] != bytes32(0)) revert BatchAlreadyAnchored();

        batchRoots[batchId] = merkleRoot;
        batchTimestamp[batchId] = block.timestamp;
        if (batchId > latestBatchId) latestBatchId = batchId;

        emit BatchAnchored(batchId, merkleRoot, block.timestamp);
    }

    /// @notice Verify that `leaf` was included in the batch anchored as `batchId`,
    ///         given a standard Merkle proof. Depth is not fixed here since batch
    ///         sizes vary — the proof array length determines depth.
    function verifyBatchLeaf(
        uint256 batchId,
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 leafIndex
    ) external view returns (bool) {
        bytes32 computedHash = leaf;
        uint256 currentIndex = leafIndex;

        for (uint256 i = 0; i < proof.length; i++) {
            if (currentIndex % 2 == 0) {
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proof[i])
                );
            } else {
                computedHash = keccak256(
                    abi.encodePacked(proof[i], computedHash)
                );
            }
            currentIndex /= 2;
        }

        return computedHash == batchRoots[batchId];
    }
}
