// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPamojaPayAccessControl} from "./IPamojaPayAccessControl.sol";

/// @title PSPRegistry
/// @notice On-chain registry of Payment Service Providers (PSPs) that
///         participate in the PamojaPay cross-border settlement network.
///
///         Two mappings matter most:
///           1. `pspAddress` — the on-chain address where escrowed funds
///              are released during settlement (the "payout address").
///           2. `recipientCommitmentToPsp` — maps a ZK commitment (a
///              Poseidon/keccak hash the sender's Noir circuit computes)
///              to the PSP that should receive the settled payment.
///              This is the bridge between the privacy-preserving
///              transfer initiation and the actual on-chain payout:
///              `PamojaEscrow.initiateTransfer` stores the commitment,
///              and `settleTransfer` looks it up here to know where
///              to send funds.
///
///         A PSP is registered by an admin and receives the PSP_ROLE
///         on the shared access controller, which lets it call
///         PSP-gated functions on LiquidityPool and Escrow.
contract PSPRegistry {
    // ── Roles (duplicated from interface for Solidity access patterns)
    bytes32 private constant _DEFAULT_ADMIN_ROLE = 0x00;

    // ── Dependencies ────────────────────────────────────────────────
    IPamojaPayAccessControl public immutable accessControl;

    // ── Types ───────────────────────────────────────────────────────
    enum PSPStatus { NONE, PENDING, ACTIVE, SUSPENDED, DEACTIVATED }

    struct PSPInfo {
        string name;            // e.g. "MTN MoMo Rwanda"
        string countryCode;     // ISO 3166-1 alpha-2, e.g. "RW"
        address pspAddress;     // on-chain payout address
        PSPStatus status;
        uint256 registeredAt;
        uint256 lastUpdatedAt;
    }

    // ── State ───────────────────────────────────────────────────────
    mapping(bytes32 => PSPInfo) public psps;          // pspId => info
    mapping(address => bytes32) public addressToPsp;  // pspAddress => pspId
    mapping(bytes32 => bytes32) public recipientCommitmentToPsp; // commitment => pspId

    bytes32[] public allPspIds;
    uint256 public totalActivePsps;

    // ── Events ──────────────────────────────────────────────────────
    event PSPRegistered(bytes32 indexed pspId, string name, string countryCode, address pspAddress);
    event PSPStatusChanged(bytes32 indexed pspId, PSPStatus oldStatus, PSPStatus newStatus);
    event RecipientCommitmentLinked(bytes32 indexed commitment, bytes32 indexed pspId);

    // ── Errors ──────────────────────────────────────────────────────
    error AlreadyRegistered();
    error NotRegistered();
    error InvalidStatus();
    error ZeroAddress();
    error CommitmentAlreadyLinked();

    // ── Constructor ─────────────────────────────────────────────────
    constructor(IPamojaPayAccessControl _accessControl) {
        if (address(_accessControl) == address(0)) revert ZeroAddress();
        accessControl = _accessControl;
    }

    // ── Admin functions ─────────────────────────────────────────────
    /// @notice Register a new PSP. Caller must have admin role on accessControl.
    function registerPSP(
        bytes32 pspId,
        string calldata name,
        string calldata countryCode,
        address pspAddress_
    ) external {
        require(accessControl.hasRole(_DEFAULT_ADMIN_ROLE, msg.sender), "not admin");
        if (psps[pspId].status != PSPStatus.NONE) revert AlreadyRegistered();
        if (pspAddress_ == address(0)) revert ZeroAddress();

        psps[pspId] = PSPInfo({
            name: name,
            countryCode: countryCode,
            pspAddress: pspAddress_,
            status: PSPStatus.ACTIVE,
            registeredAt: block.timestamp,
            lastUpdatedAt: block.timestamp
        });
        addressToPsp[pspAddress_] = pspId;
        allPspIds.push(pspId);
        totalActivePsps++;

        // Grant PSP_ROLE to the PSP's address on the shared access controller
        // Note: admin must first grant the accessControl admin the right to manage PSP_ROLE,
        // or this call must come from the accessControl admin. In practice, the deployer
        // grants PSP_ROLE through the access controller's grantRole.
        emit PSPRegistered(pspId, name, countryCode, pspAddress_);
    }

    /// @notice Change a PSP's operational status.
    function setPSPStatus(bytes32 pspId, PSPStatus newStatus) external {
        require(accessControl.hasRole(_DEFAULT_ADMIN_ROLE, msg.sender), "not admin");
        if (psps[pspId].status == PSPStatus.NONE) revert NotRegistered();
        if (newStatus == PSPStatus.NONE) revert InvalidStatus();

        PSPStatus old = psps[pspId].status;
        psps[pspId].status = newStatus;
        psps[pspId].lastUpdatedAt = block.timestamp;

        if (old == PSPStatus.ACTIVE && newStatus != PSPStatus.ACTIVE) {
            totalActivePsps--;
        } else if (old != PSPStatus.ACTIVE && newStatus == PSPStatus.ACTIVE) {
            totalActivePsps++;
        }

        emit PSPStatusChanged(pspId, old, newStatus);
    }

    /// @notice Link a recipient commitment (from the sender's ZK proof) to
    ///         the PSP that will receive the settled funds. This is how
    ///         `PamojaEscrow.settleTransfer` resolves the recipient.
    function linkRecipientCommitment(bytes32 commitment, bytes32 pspId) external {
        require(accessControl.hasRole(_DEFAULT_ADMIN_ROLE, msg.sender), "not admin");
        if (psps[pspId].status == PSPStatus.NONE) revert NotRegistered();
        if (recipientCommitmentToPsp[commitment] != bytes32(0)) revert CommitmentAlreadyLinked();

        recipientCommitmentToPsp[commitment] = pspId;
        emit RecipientCommitmentLinked(commitment, pspId);
    }

    // ── View functions ──────────────────────────────────────────────
    /// @notice Resolve a recipient commitment to the PSP's payout address.
    ///         Returns address(0) if the commitment is not linked.
    function resolveRecipient(bytes32 commitment) external view returns (address) {
        bytes32 pspId = recipientCommitmentToPsp[commitment];
        if (pspId == bytes32(0)) return address(0);
        return psps[pspId].pspAddress;
    }

    function getPSPCount() external view returns (uint256) {
        return allPspIds.length;
    }

    function isPSPActive(bytes32 pspId) external view returns (bool) {
        return psps[pspId].status == PSPStatus.ACTIVE;
    }
}
