// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IPamojaPayAccessControl} from "../../src/IPamojaPayAccessControl.sol";
import {PamojaPayAccessControl} from "../../src/PamojaPayAccessControl.sol";
import {PSPRegistry} from "../../src/PSPRegistry.sol";
import {RateOracle} from "../../src/RateOracle.sol";
import {LiquidityPool} from "../../src/LiquidityPool.sol";
import {PamojaEscrow} from "../../src/PamojaEscrow.sol";
import {EscrowHandler} from "./EscrowHandler.sol";

/// @title SettlementInvariants
/// @notice Invariant tests for the PamojaPay transfer lifecycle.
contract SettlementInvariants is Test {
    PamojaPayAccessControl accessControl;
    PSPRegistry pspRegistry;
    RateOracle rateOracle;
    LiquidityPool liquidityPool;
    PamojaEscrow escrow;
    EscrowHandler handler;

    address admin = makeAddr("admin");

    function setUp() public {
        accessControl = new PamojaPayAccessControl(admin, makeAddr("guardian"));
        pspRegistry = new PSPRegistry(IPamojaPayAccessControl(address(accessControl)));
        rateOracle = new RateOracle(IPamojaPayAccessControl(address(accessControl)), 48 hours);
        liquidityPool = new LiquidityPool(
            IPamojaPayAccessControl(address(accessControl)),
            rateOracle,
            "USDC"
        );
        escrow = new PamojaEscrow(
            IPamojaPayAccessControl(address(accessControl)),
            rateOracle,
            pspRegistry
        );

        handler = new EscrowHandler(escrow, pspRegistry, rateOracle, liquidityPool, accessControl);

        vm.startPrank(admin);
        accessControl.grantRole(0x00, address(handler));
        accessControl.grantRole(keccak256("ORACLE_ROLE"), address(handler));
        vm.stopPrank();

        for (uint8 i = 0; i < 5; i++) {
            address psp = makeAddr(string(abi.encodePacked("psp_", i)));
            handler.addPSP(psp);
        }

        handler.seedRate("USDC", "RWF", 1300 * 1e8);
        handler.seedRate("USDC", "KES", 150 * 1e8);
        handler.seedRate("USDC", "UGX", 3800 * 1e8);
        handler.seedLiquidity(makeAddr("seedLP"), 10_000_000e6);

        targetContract(address(handler));
    }

    /// @notice INVARIANT 1: Accounting identity
    ///         totalTransfers == totalSettled + totalRefunded + activeTransfers
    function invariant_accountingIdentity() public view {
        uint256 totalTransfers = escrow.totalTransfers();
        uint256 totalSettled = escrow.totalSettled();
        uint256 totalRefunded = escrow.totalRefunded();

        uint256 activeCount = 0;
        uint256 len = escrow.getTransferCount();
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = escrow.getTransferIdAtIndex(i);
            (, , , , , , , , PamojaEscrow.TransferStatus status) = escrow.getTransfer(id);
            if (status == PamojaEscrow.TransferStatus.INITIATED) {
                activeCount++;
            }
        }

        assertEq(
            totalTransfers,
            totalSettled + totalRefunded + activeCount,
            "accounting identity violated"
        );
    }

    /// @notice INVARIANT 2: Counts never underflow
    function invariant_countsNeverUnderflow() public view {
        assertTrue(escrow.totalSettled() <= escrow.totalTransfers(), "totalSettled > total");
        assertTrue(escrow.totalRefunded() <= escrow.totalTransfers(), "totalRefunded > total");
        assertTrue(
            escrow.totalSettled() + escrow.totalRefunded() <= escrow.totalTransfers(),
            "settled + refunded > total"
        );
    }

    /// @notice INVARIANT 3: No transfer in allTransferIds has status NONE
    function invariant_statusMonotonicity() public view {
        uint256 len = escrow.getTransferCount();
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = escrow.getTransferIdAtIndex(i);
            (, , , , , , , , PamojaEscrow.TransferStatus status) = escrow.getTransfer(id);
            assertTrue(status != PamojaEscrow.TransferStatus.NONE, "transfer has NONE status");
        }
    }

    /// @notice INVARIANT 4: No double-settle or double-refund
    function invariant_noDoubleSettleOrRefund() public view {
        uint256 len = escrow.getTransferCount();
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = escrow.getTransferIdAtIndex(i);
            (, , , , , , , , PamojaEscrow.TransferStatus status) = escrow.getTransfer(id);
            if (status == PamojaEscrow.TransferStatus.SETTLED) {
                assertTrue(escrow.isTransferSettled(id), "SETTLED but isTransferSettled false");
            }
            if (status == PamojaEscrow.TransferStatus.REFUNDED) {
                assertFalse(escrow.isTransferRefundable(id), "REFUNDED but isTransferRefundable true");
            }
        }
    }

    /// @notice INVARIANT 5: All transfers have non-zero amount
    function invariant_noZeroAmountTransfers() public view {
        uint256 len = escrow.getTransferCount();
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = escrow.getTransferIdAtIndex(i);
            (, , , uint256 amount, , , , , PamojaEscrow.TransferStatus status) = escrow.getTransfer(id);
            if (status != PamojaEscrow.TransferStatus.NONE) {
                assertGt(amount, 0, "transfer has zero amount");
            }
        }
    }

    /// @notice INVARIANT 6: isTransferRefundable matches timeout check
    function invariant_refundRequiresTimeout() public view {
        uint256 len = escrow.getTransferCount();
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = escrow.getTransferIdAtIndex(i);
            (, , , , , , uint256 initiatedAt, uint256 timeoutSeconds, PamojaEscrow.TransferStatus status) =
                escrow.getTransfer(id);
            if (status == PamojaEscrow.TransferStatus.INITIATED) {
                bool canRefund = block.timestamp >= initiatedAt + timeoutSeconds;
                assertEq(escrow.isTransferRefundable(id), canRefund, "refundable mismatch");
            }
        }
    }

    /// @notice INVARIANT 7: Active transfer amounts bounded by pool liquidity
    function invariant_transferAmountBoundedByPool() public view {
        uint256 poolLiquidity = liquidityPool.totalLiquidity();
        uint256 len = escrow.getTransferCount();
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = escrow.getTransferIdAtIndex(i);
            (, , , uint256 amount, , , , , PamojaEscrow.TransferStatus status) = escrow.getTransfer(id);
            if (status == PamojaEscrow.TransferStatus.INITIATED) {
                assertLe(amount, poolLiquidity, "active transfer exceeds pool liquidity");
            }
        }
    }

    /// @notice INVARIANT 8: LiquidityPool totalLiquidity == sum of individual deposits
    function invariant_liquidityAccounting() public view {
        uint256 totalFromDeposits = 0;
        uint256 lpCount = liquidityPool.getLPCount();
        for (uint256 i = 0; i < lpCount; i++) {
            address lp = liquidityPool.getLPAtIndex(i);
            (uint256 amount, ) = liquidityPool.getLPDeposit(lp);
            totalFromDeposits += amount;
        }
        assertEq(
            liquidityPool.totalLiquidity(),
            totalFromDeposits,
            "pool totalLiquidity != sum of deposits"
        );
    }
}
