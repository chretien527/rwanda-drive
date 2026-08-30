// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPamojaPayAccessControl} from "./IPamojaPayAccessControl.sol";

/// @title DisclosureRegistry
/// @notice Stores encrypted ciphertext blobs for the Bank of Rwanda (BNR)
///         verifiable-disclosure workflow. When a PSP or regulator needs
///         to verify a user's identity or transaction details, the user's
///         Noir circuit (`verifiable_disclosure.nr`) produces a ZK proof
///         that the ciphertext decrypts to valid data under the BNR's
///         public key — without revealing the plaintext on-chain.
///
///         This contract only stores the ciphertext; decryption happens
///         off-chain by the BNR using their HSM-held private key.
///         The ZK proof verified on-chain (via the verifier contract)
///         guarantees that the ciphertext is well-formed and corresponds
///         to a real user credential.
///
///         Ciphertexts are keyed by a commitment derived from the user's
///         identity commitment and the disclosure purpose, so each
///         disclosure is a unique, linkable operation.
contract DisclosureRegistry {
    // ── Roles (duplicated from interface for Solidity access patterns)
    bytes32 private constant _DEFAULT_ADMIN_ROLE = 0x00;

    // ── Dependencies ────────────────────────────────────────────────
    IPamojaPayAccessControl public immutable accessControl;

    // ── Types ───────────────────────────────────────────────────────
    struct Disclosure {
        bytes ciphertext;          // encrypted data (variable length)
        bytes32 purposeHash;       // keccak256 of the disclosure purpose string
        address requester;         // who requested the disclosure (PSP, regulator, etc.)
        uint256 blockNumber;       // block at which this was stored
        bool exists;
    }

    // ── State ───────────────────────────────────────────────────────
    mapping(bytes32 => Disclosure) public disclosures;  // commitment => disclosure
    bytes32[] public allCommitments;
    uint256 public totalDisclosures;

    // Verifier address — the Groth16 verifier contract for the
    // verifiable_disclosure Noir circuit
    address public verifierAddress;

    // ── Events ──────────────────────────────────────────────────────
    event DisclosureStored(
        bytes32 indexed commitment,
        bytes32 indexed purposeHash,
        address indexed requester,
        uint256 blockNumber
    );
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    // ── Errors ──────────────────────────────────────────────────────
    error AlreadyExists();
    error NotFound();
    error ZeroAddress();
    error EmptyCiphertext();

    // ── Constructor ─────────────────────────────────────────────────
    constructor(IPamojaPayAccessControl _accessControl) {
        if (address(_accessControl) == address(0)) revert ZeroAddress();
        accessControl = _accessControl;
    }

    // ── Mutative ────────────────────────────────────────────────────
    /// @notice Store a new encrypted disclosure. In production this would
    ///         also verify the ZK proof against the Groth16 verifier
    ///         before accepting the ciphertext.
    function storeDisclosure(
        bytes32 commitment,
        bytes calldata ciphertext,
        bytes32 purposeHash,
        address requester
    ) external {
        if (disclosures[commitment].exists) revert AlreadyExists();
        if (ciphertext.length == 0) revert EmptyCiphertext();

        disclosures[commitment] = Disclosure({
            ciphertext: ciphertext,
            purposeHash: purposeHash,
            requester: requester,
            blockNumber: block.number,
            exists: true
        });
        allCommitments.push(commitment);
        totalDisclosures++;

        emit DisclosureStored(commitment, purposeHash, requester, block.number);
    }

    /// @notice Update the Groth16 verifier address (e.g. after a circuit upgrade).
    function setVerifier(address newVerifier) external {
        require(
            accessControl.hasRole(_DEFAULT_ADMIN_ROLE, msg.sender),
            "not admin"
        );
        if (newVerifier == address(0)) revert ZeroAddress();

        emit VerifierUpdated(verifierAddress, newVerifier);
        verifierAddress = newVerifier;
    }

    // ── View functions ──────────────────────────────────────────────
    /// @notice Get the ciphertext for a given commitment.
    ///         In production, access would be restricted to authorized
    ///         parties (BNR, auditors) via a ZK-gated access pattern.
    function getCiphertext(bytes32 commitment) external view returns (bytes memory) {
        if (!disclosures[commitment].exists) revert NotFound();
        return disclosures[commitment].ciphertext;
    }

    /// @notice Get full disclosure metadata.
    function getDisclosure(bytes32 commitment)
        external
        view
        returns (
            bytes memory ciphertext,
            bytes32 purposeHash,
            address requester,
            uint256 blockNumber
        )
    {
        Disclosure storage d = disclosures[commitment];
        if (!d.exists) revert NotFound();
        return (d.ciphertext, d.purposeHash, d.requester, d.blockNumber);
    }

    /// @notice Check if a disclosure commitment exists on-chain.
    function exists(bytes32 commitment) external view returns (bool) {
        return disclosures[commitment].exists;
    }
}
