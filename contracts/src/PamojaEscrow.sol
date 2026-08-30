// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPamojaPayAccessControl} from "./IPamojaPayAccessControl.sol";
import {RateOracle} from "./RateOracle.sol";
import {PSPRegistry} from "./PSPRegistry.sol";

/// @title PamojaEscrow
/// @notice Core settlement contract for cross-border payments.
///
///         Lifecycle of a transfer:
///           1. `initiateTransfer` — sender's PSP locks funds in escrow.
///              The sender's Noir circuit generates a ZK proof that they
///              have sufficient balance and the transfer parameters are
///              valid. The proof is verified against the on-chain
///              `balance_sufficiency` verifier. A `recipientCommitment`
///              is stored (a ZK hash) which later resolves to the
///              recipient PSP's payout address via PSPRegistry.
///
///           2. `settleTransfer` — the recipient's PSP (or the platform)
///              settles the transfer. The `recipientCommitment` is
///              resolved through PSPRegistry to find the actual payout
///              address. The escrowed funds are released to that address.
///              The FX rate is fetched from RateOracle at settlement
///              time, so the recipient receives the correct amount in
///              their local currency equivalent.
///
///           3. `refundTransfer` — if settlement doesn't happen within
///              the timeout window, the sender can reclaim their funds.
///
///         The contract holds USDC (or the pool's base stablecoin)
///         on behalf of in-flight transfers. LiquidityPool provides
///         the backing liquidity.
contract PamojaEscrow {
    // ── Roles (duplicated from interface for Solidity access patterns)
    bytes32 private constant _PSP_ROLE = keccak256("PSP_ROLE");

    // ── Dependencies ────────────────────────────────────────────────
    IPamojaPayAccessControl public immutable accessControl;
    RateOracle public immutable rateOracle;
    PSPRegistry public immutable pspRegistry;

    // ── Types ───────────────────────────────────────────────────────
    enum TransferStatus { NONE, INITIATED, SETTLED, REFUNDED }

    struct Transfer {
        address senderPsp;           // PSP that initiated the transfer
        address senderAddress;       // the actual sender (for refund)
        bytes32 recipientCommitment; // ZK commitment resolved via PSPRegistry
        uint256 amount;              // amount in base currency (e.g. USDC, 6 decimals)
        string baseCurrency;         // e.g. "USDC"
        string targetCurrency;       // e.g. "RWF"
        uint256 initiatedAt;
        uint256 timeoutSeconds;      // deadline for settlement
        TransferStatus status;
    }

    // ── State ───────────────────────────────────────────────────────
    mapping(bytes32 => Transfer) public transfers;  // transferId => transfer
    bytes32[] public allTransferIds;
    uint256 public totalTransfers;
    uint256 public totalSettled;
    uint256 public totalRefunded;

    // Default timeout for settlement (e.g. 24 hours)
    uint256 public constant DEFAULT_TIMEOUT = 24 hours;

    // ── Events ──────────────────────────────────────────────────────
    event TransferInitiated(
        bytes32 indexed transferId,
        address indexed senderPsp,
        bytes32 recipientCommitment,
        uint256 amount,
        string baseCurrency,
        string targetCurrency
    );
    event TransferSettled(
        bytes32 indexed transferId,
        address indexed recipientPsp,
        address recipientAddress,
        uint256 rateUsed,
        uint256 settledAmount
    );
    event TransferRefunded(
        bytes32 indexed transferId,
        address indexed senderAddress,
        uint256 amount
    );

    // ── Errors ──────────────────────────────────────────────────────
    error TransferAlreadyExists();
    error TransferNotFound();
    error InvalidStatus();
    error NotAuthorized();
    error TimeoutNotReached(uint256 deadline, uint256 currentTime);
    error RecipientNotResolved(bytes32 commitment);
    error ZeroAmount();
    error ZeroAddress();

    // ── Constructor ─────────────────────────────────────────────────
    constructor(
        IPamojaPayAccessControl _accessControl,
        RateOracle _rateOracle,
        PSPRegistry _pspRegistry
    ) {
        if (address(_accessControl) == address(0)) revert ZeroAddress();
        if (address(_rateOracle) == address(0)) revert ZeroAddress();
        if (address(_pspRegistry) == address(0)) revert ZeroAddress();
        accessControl = _accessControl;
        rateOracle = _rateOracle;
        pspRegistry = _pspRegistry;
    }

    // ── Core functions ──────────────────────────────────────────────
    /// @notice Initiate a cross-border transfer. The sender's PSP locks
    ///         funds in escrow. In production, this would also verify
    ///         the ZK proof of balance sufficiency against the Groth16
    ///         verifier before accepting the transfer.
    ///
    /// @param transferId        Unique identifier (keccak256 of transfer params)
    /// @param recipientCommitment  ZK commitment for the recipient
    /// @param amount            Amount in base currency
    /// @param baseCurrency      e.g. "USDC"
    /// @param targetCurrency    e.g. "RWF"
    function initiateTransfer(
        bytes32 transferId,
        bytes32 recipientCommitment,
        uint256 amount,
        string calldata baseCurrency,
        string calldata targetCurrency
    ) external onlyPSP {
        if (transfers[transferId].status != TransferStatus.NONE) {
            revert TransferAlreadyExists();
        }
        if (amount == 0) revert ZeroAmount();

        transfers[transferId] = Transfer({
            senderPsp: msg.sender,
            senderAddress: msg.sender, // in production: extracted from the ZK proof's public inputs
            recipientCommitment: recipientCommitment,
            amount: amount,
            baseCurrency: baseCurrency,
            targetCurrency: targetCurrency,
            initiatedAt: block.timestamp,
            timeoutSeconds: DEFAULT_TIMEOUT,
            status: TransferStatus.INITIATED
        });
        allTransferIds.push(transferId);
        totalTransfers++;

        emit TransferInitiated(
            transferId,
            msg.sender,
            recipientCommitment,
            amount,
            baseCurrency,
            targetCurrency
        );
    }

    /// @notice Settle a transfer — release escrowed funds to the recipient.
    ///         The recipientCommitment is resolved through PSPRegistry to
    ///         find the actual payout address. The FX rate is fetched from
    ///         RateOracle for the conversion.
    ///
    ///         In production, this would be called by the recipient's PSP
    ///         after they've confirmed the off-chain credit (MoMo/bank).
    function settleTransfer(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];
        if (t.status == TransferStatus.NONE) revert TransferNotFound();
        if (t.status != TransferStatus.INITIATED) revert InvalidStatus();

        // Resolve the recipient commitment to an actual PSP address
        address recipientAddress = pspRegistry.resolveRecipient(t.recipientCommitment);
        if (recipientAddress == address(0)) {
            revert RecipientNotResolved(t.recipientCommitment);
        }

        // Fetch the FX rate for the conversion
        uint256 rate = rateOracle.getRate(t.baseCurrency, t.targetCurrency);

        // In production: pull tokens from escrow and send to recipientAddress.
        // For now, we update accounting.
        t.status = TransferStatus.SETTLED;
        totalSettled++;

        emit TransferSettled(transferId, recipientAddress, recipientAddress, rate, t.amount);
    }

    /// @notice Refund a transfer after the timeout has elapsed.
    ///         Only the original sender (or their PSP) can claim the refund.
    function refundTransfer(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];
        if (t.status == TransferStatus.NONE) revert TransferNotFound();
        if (t.status != TransferStatus.INITIATED) revert InvalidStatus();

        // Check timeout has elapsed
        uint256 deadline = t.initiatedAt + t.timeoutSeconds;
        if (block.timestamp < deadline) {
            revert TimeoutNotReached(deadline, block.timestamp);
        }

        // Only the sender's PSP or the sender themselves can claim refund
        if (msg.sender != t.senderPsp && msg.sender != t.senderAddress) {
            revert NotAuthorized();
        }

        t.status = TransferStatus.REFUNDED;
        totalRefunded++;

        // In production: transfer tokens back to t.senderAddress
        emit TransferRefunded(transferId, t.senderAddress, t.amount);
    }

    // ── View functions ──────────────────────────────────────────────
    function getTransferCount() external view returns (uint256) {
        return allTransferIds.length;
    }

    function getTransferIdAtIndex(uint256 index) external view returns (bytes32) {
        return allTransferIds[index];
    }

    function getTransfer(bytes32 transferId)
        external
        view
        returns (
            address senderPsp,
            address senderAddress,
            bytes32 recipientCommitment,
            uint256 amount,
            string memory baseCurrency,
            string memory targetCurrency,
            uint256 initiatedAt,
            uint256 timeoutSeconds,
            TransferStatus status
        )
    {
        Transfer storage t = transfers[transferId];
        return (
            t.senderPsp,
            t.senderAddress,
            t.recipientCommitment,
            t.amount,
            t.baseCurrency,
            t.targetCurrency,
            t.initiatedAt,
            t.timeoutSeconds,
            t.status
        );
    }

    function isTransferSettled(bytes32 transferId) external view returns (bool) {
        return transfers[transferId].status == TransferStatus.SETTLED;
    }

    function isTransferRefundable(bytes32 transferId) external view returns (bool) {
        Transfer storage t = transfers[transferId];
        return t.status == TransferStatus.INITIATED &&
               block.timestamp >= t.initiatedAt + t.timeoutSeconds;
    }

    // ── Modifiers ───────────────────────────────────────────────────
    modifier onlyPSP() {
        if (!accessControl.hasRole(_PSP_ROLE, msg.sender)) {
            revert NotAuthorized();
        }
        _;
    }
}
