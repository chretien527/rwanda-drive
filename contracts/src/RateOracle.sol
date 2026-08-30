// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPamojaPayAccessControl} from "./IPamojaPayAccessControl.sol";

/// @title RateOracle
/// @notice On-chain FX rate provider for the PamojaPay settlement network.
///         Rates are pushed by the Chainlink CRE (Don-based) workflow and
///         stored with timestamps so consumers can enforce staleness bounds.
///
///         Currency pairs are encoded as `keccak256(baseCurrency, quoteCurrency)`
///         e.g. keccak256("RWF", "USDC") for the Rwandan Franc / USDC rate.
///
///         Design decision: this contract is imported directly by PamojaEscrow
///         (typed import), NOT called via `staticcall`. The dependency direction
///         is: RateOracle knows nothing about Escrow; Escrow imports RateOracle.
///         This avoids circular imports because RateOracle only depends on
///         IPamojaPayAccessControl (which everyone depends on).
contract RateOracle {
    // ── Roles (duplicated from interface for Solidity access patterns)
    bytes32 private constant _ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 private constant _DEFAULT_ADMIN_ROLE = 0x00;

    // ── Dependencies ────────────────────────────────────────────────
    IPamojaPayAccessControl public immutable accessControl;

    // ── Types ───────────────────────────────────────────────────────
    struct RateEntry {
        uint256 rate;        // scaled by 1e8 (Chainlink convention)
        uint256 updatedAt;   // block.timestamp when rate was pushed
        bool exists;
    }

    // ── State ───────────────────────────────────────────────────────
    mapping(bytes32 => RateEntry) public rates;  // pairHash => rate
    uint256 public maxStalenessSeconds;          // e.g. 3600 (1 hour)

    // ── Events ──────────────────────────────────────────────────────
    event RateUpdated(bytes32 indexed pairHash, string baseCurrency, string quoteCurrency, uint256 rate);
    event MaxStalenessUpdated(uint256 oldMaxStaleness, uint256 newMaxStaleness);

    // ── Errors ──────────────────────────────────────────────────────
    error RateStale(bytes32 pairHash, uint256 lastUpdated, uint256 maxStaleness);
    error RateNotSet(bytes32 pairHash);
    error InvalidRate();

    // ── Constructor ─────────────────────────────────────────────────
    constructor(IPamojaPayAccessControl _accessControl, uint256 _maxStalenessSeconds) {
        if (address(_accessControl) == address(0)) revert InvalidRate();
        accessControl = _accessControl;
        maxStalenessSeconds = _maxStalenessSeconds;
    }

    // ── Mutative ────────────────────────────────────────────────────
    /// @notice Push a fresh FX rate. Caller must hold ORACLE_ROLE.
    /// @param baseCurrency  e.g. "RWF"
    /// @param quoteCurrency e.g. "USDC"
    /// @param rate          The exchange rate, scaled by 1e8
    function updateRate(
        string calldata baseCurrency,
        string calldata quoteCurrency,
        uint256 rate
    ) external onlyRole(_ORACLE_ROLE) {
        if (rate == 0) revert InvalidRate();

        bytes32 pairHash = keccak256(abi.encode(baseCurrency, quoteCurrency));
        rates[pairHash] = RateEntry({
            rate: rate,
            updatedAt: block.timestamp,
            exists: true
        });

        emit RateUpdated(pairHash, baseCurrency, quoteCurrency, rate);
    }

    /// @notice Update the maximum staleness threshold. Admin only.
    function setMaxStaleness(uint256 newMaxStaleness) external onlyRole(_DEFAULT_ADMIN_ROLE) {
        emit MaxStalenessUpdated(maxStalenessSeconds, newMaxStaleness);
        maxStalenessSeconds = newMaxStaleness;
    }

    // ── View ────────────────────────────────────────────────────────
    /// @notice Get the current rate for a currency pair, reverting if stale.
    function getRate(string calldata baseCurrency, string calldata quoteCurrency) external view returns (uint256) {
        bytes32 pairHash = keccak256(abi.encode(baseCurrency, quoteCurrency));
        RateEntry storage entry = rates[pairHash];

        if (!entry.exists) revert RateNotSet(pairHash);
        if (block.timestamp - entry.updatedAt > maxStalenessSeconds) {
            revert RateStale(pairHash, entry.updatedAt, maxStalenessSeconds);
        }

        return entry.rate;
    }

    /// @notice Same as getRate but returns (rate, timestamp) for consumers
    ///         that want to log the rate used.
    function getRateWithTimestamp(
        string calldata baseCurrency,
        string calldata quoteCurrency
    ) external view returns (uint256 rate, uint256 timestamp) {
        bytes32 pairHash = keccak256(abi.encode(baseCurrency, quoteCurrency));
        RateEntry storage entry = rates[pairHash];

        if (!entry.exists) revert RateNotSet(pairHash);
        if (block.timestamp - entry.updatedAt > maxStalenessSeconds) {
            revert RateStale(pairHash, entry.updatedAt, maxStalenessSeconds);
        }

        return (entry.rate, entry.updatedAt);
    }

    /// @notice Check if a rate exists and is fresh (no revert, returns bool).
    function isRateFresh(string calldata baseCurrency, string calldata quoteCurrency) external view returns (bool) {
        bytes32 pairHash = keccak256(abi.encode(baseCurrency, quoteCurrency));
        RateEntry storage entry = rates[pairHash];
        return entry.exists && (block.timestamp - entry.updatedAt <= maxStalenessSeconds);
    }

    // ── Internal ────────────────────────────────────────────────────
    modifier onlyRole(bytes32 role) {
        if (!accessControl.hasRole(role, msg.sender)) revert Unauthorized();
        _;
    }

    error Unauthorized();
}
