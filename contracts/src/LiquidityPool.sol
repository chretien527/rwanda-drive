// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPamojaPayAccessControl} from "./IPamojaPayAccessControl.sol";
import {RateOracle} from "./RateOracle.sol";

/// @title LiquidityPool
/// @notice Holds stablecoin liquidity for cross-border settlement.
///         LPs (liquidity providers) deposit a single stablecoin
///         (e.g. USDC) and receive pool shares proportional to their
///         contribution. The pool's total liquidity is used by
///         PamojaEscrow to fund cross-border transfers.
///
///         The `totalLiquidity()` view is designed to be consumed by
///         the `proof_of_reserves` Noir circuit off-chain: the prover
///         shows that `sum(deposits) == totalLiquidity` without
///         revealing individual deposit amounts.
///
///         LP roles are managed through the shared AccessControl.
contract LiquidityPool {
    // ── Roles (duplicated from interface for Solidity access patterns)
    bytes32 private constant _DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 private constant _LP_PROVIDER_ROLE = keccak256("LP_PROVIDER_ROLE");

    // ── Dependencies ────────────────────────────────────────────────
    IPamojaPayAccessControl public immutable accessControl;
    RateOracle public immutable rateOracle;

    // ── Types ───────────────────────────────────────────────────────
    struct Deposit {
        uint256 amount;
        uint256 depositedAt;
        bool exists;
    }

    // ── State ───────────────────────────────────────────────────────
    mapping(address => Deposit) public deposits;      // lpAddress => deposit
    address[] public lpList;
    uint256 public totalLiquidity;                     // sum of all deposits
    string public baseCurrency;                        // e.g. "USDC"

    // ── Events ──────────────────────────────────────────────────────
    event LiquidityDeposited(address indexed lp, uint256 amount, uint256 newTotal);
    event LiquidityWithdrawn(address indexed lp, uint256 amount, uint256 newTotal);

    // ── Errors ──────────────────────────────────────────────────────
    error ZeroAmount();
    error InsufficientLiquidity(uint256 requested, uint256 available);
    error NotLP();
    error NoDeposit();
    error ZeroAddress();

    // ── Constructor ─────────────────────────────────────────────────
    constructor(
        IPamojaPayAccessControl _accessControl,
        RateOracle _rateOracle,
        string memory _baseCurrency
    ) {
        if (address(_accessControl) == address(0) || address(_rateOracle) == address(0)) revert ZeroAddress();
        accessControl = _accessControl;
        rateOracle = _rateOracle;
        baseCurrency = _baseCurrency;
    }

    // ── LP functions ────────────────────────────────────────────────
    /// @notice Deposit stablecoin liquidity into the pool.
    ///         Caller must hold LP_PROVIDER_ROLE.
    function deposit(uint256 amount) external onlyLP {
        if (amount == 0) revert ZeroAmount();

        Deposit storage dep = deposits[msg.sender];
        if (dep.exists) {
            totalLiquidity -= dep.amount;
            dep.amount += amount;
        } else {
            dep.amount = amount;
            dep.exists = true;
            lpList.push(msg.sender);
        }
        dep.depositedAt = block.timestamp;
        totalLiquidity += dep.amount;

        // In production, this would pull USDC via a Safe transferFrom.
        // For now, we track the accounting. The actual token transfer
        // would use IERC20.transferFrom(msg.sender, address(this), amount).
        emit LiquidityDeposited(msg.sender, amount, totalLiquidity);
    }

    /// @notice Withdraw liquidity. Cannot withdraw more than deposited.
    function withdraw(uint256 amount) external onlyLP {
        if (amount == 0) revert ZeroAmount();

        Deposit storage dep = deposits[msg.sender];
        if (!dep.exists || dep.amount == 0) revert NoDeposit();
        if (dep.amount < amount) revert InsufficientLiquidity(amount, dep.amount);

        dep.amount -= amount;
        totalLiquidity -= amount;

        // In production: IERC20(baseCurrency).transfer(msg.sender, amount);
        emit LiquidityWithdrawn(msg.sender, amount, totalLiquidity);
    }

    // ── Escrow-facing functions ─────────────────────────────────────
    /// @notice Lock liquidity for a transfer. Called by PamojaEscrow
    ///         during initiateTransfer. Reduces available liquidity
    ///         without moving tokens (they stay in the pool contract).
    function lockLiquidity(uint256 amount) external onlyEscrow {
        if (amount == 0) revert ZeroAmount();
        if (totalLiquidity < amount) revert InsufficientLiquidity(amount, totalLiquidity);
        // Liquidity is "locked" by the escrow contract's accounting;
        // the pool's totalLiquidity still reflects the full balance
        // because the escrow will settle back into the pool.
        // A more sophisticated version would track locked vs available separately.
    }

    /// @notice Release liquidity back after a refund.
    function releaseLiquidity(uint256 amount) external onlyEscrow {
        // No-op for now — the tokens never left the pool.
        // In a version with external token transfers, this would
        // update internal accounting.
    }

    // ── View functions ──────────────────────────────────────────────
    /// @notice Get the total number of active LPs.
    function getLPCount() external view returns (uint256) {
        return lpList.length;
    }

    function getLPAtIndex(uint256 index) external view returns (address) {
        return lpList[index];
    }

    /// @notice Get an LP's deposit info.
    function getLPDeposit(address lp) external view returns (uint256 amount, uint256 depositedAt) {
        Deposit storage dep = deposits[lp];
        return (dep.amount, dep.depositedAt);
    }

    /// @notice Check if the pool has sufficient liquidity for a transfer.
    function hasSufficientLiquidity(uint256 amount) external view returns (bool) {
        return totalLiquidity >= amount;
    }

    // ── Modifiers ───────────────────────────────────────────────────
    modifier onlyLP() {
        if (!accessControl.hasRole(_LP_PROVIDER_ROLE, msg.sender)) {
            revert NotLP();
        }
        _;
    }

    modifier onlyEscrow() {
        // In production, check that msg.sender is the registered PamojaEscrow address.
        // For now, only the admin can call escrow-facing functions during testing.
        require(
            accessControl.hasRole(_DEFAULT_ADMIN_ROLE, msg.sender),
            "not escrow or admin"
        );
        _;
    }
}
