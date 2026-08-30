// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PamojaPayAccessControl} from "../src/PamojaPayAccessControl.sol";
import {IPamojaPayAccessControl} from "../src/IPamojaPayAccessControl.sol";
import {PSPRegistry} from "../src/PSPRegistry.sol";
import {RateOracle} from "../src/RateOracle.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {PamojaEscrow} from "../src/PamojaEscrow.sol";

/// @title PamojaEscrowTest
/// @notice Integration tests for the full PamojaPay transfer lifecycle.
contract PamojaEscrowTest is Test {
    PamojaPayAccessControl accessControl;
    PSPRegistry pspRegistry;
    RateOracle rateOracle;
    LiquidityPool liquidityPool;
    PamojaEscrow escrow;

    // Actors
    address admin;
    address guardian;
    address pspRwanda;      // sender PSP
    address pspKenya;       // recipient PSP
    address lpProvider;
    address oracleForwarder; // Chainlink CRE forwarder

    // Constants
    bytes32 constant PSP_RWANDA_ID = keccak256("MTN_MoMo_Rwanda");
    bytes32 constant PSP_KENYA_ID = keccak256("M_Pesa_Kenya");
    bytes32 constant RECIPIENT_COMMITMENT = keccak256("recipient_zk_commitment_001");
    uint256 constant MAX_STALENESS = 1 hours;
    uint256 constant RATE_1300 = 1300 * 1e8; // 1 USDC = 1300 RWF (scaled by 1e8)

    function setUp() public {
        // Deploy access control
        admin = makeAddr("admin");
        guardian = makeAddr("guardian");
        accessControl = new PamojaPayAccessControl(admin, guardian);

        // Deploy PSPRegistry
        pspRegistry = new PSPRegistry(IPamojaPayAccessControl(address(accessControl)));

        // Deploy RateOracle
        rateOracle = new RateOracle(IPamojaPayAccessControl(address(accessControl)), MAX_STALENESS);

        // Deploy LiquidityPool
        liquidityPool = new LiquidityPool(
            IPamojaPayAccessControl(address(accessControl)),
            rateOracle,
            "USDC"
        );

        // Deploy PamojaEscrow
        escrow = new PamojaEscrow(
            IPamojaPayAccessControl(address(accessControl)),
            rateOracle,
            pspRegistry
        );

        // Setup actors
        pspRwanda = makeAddr("pspRwanda");
        pspKenya = makeAddr("pspKenya");
        lpProvider = makeAddr("lpProvider");
        oracleForwarder = makeAddr("oracleForwarder");

        // Grant roles
        vm.startPrank(admin);
        accessControl.grantRole(keccak256("PSP_ROLE"), pspRwanda);
        accessControl.grantRole(keccak256("PSP_ROLE"), pspKenya);
        accessControl.grantRole(keccak256("ORACLE_ROLE"), oracleForwarder);
        accessControl.grantRole(keccak256("LP_PROVIDER_ROLE"), lpProvider);
        vm.stopPrank();

        // Register PSPs
        vm.startPrank(admin);
        pspRegistry.registerPSP(PSP_RWANDA_ID, "MTN MoMo", "RW", pspRwanda);
        pspRegistry.registerPSP(PSP_KENYA_ID, "M-Pesa", "KE", pspKenya);
        vm.stopPrank();

        // Link recipient commitment to Kenya PSP
        vm.prank(admin);
        pspRegistry.linkRecipientCommitment(RECIPIENT_COMMITMENT, PSP_KENYA_ID);

        // Push FX rate
        vm.prank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);

        // Deposit liquidity
        vm.prank(lpProvider);
        liquidityPool.deposit(1_000_000e6); // 1M USDC
    }

    // ── initiateTransfer tests ───────────────────────────────────────

    function test_InitiateTransfer_LocksCorrectAmount() public {
        bytes32 transferId = keccak256("transfer-001");
        uint256 amount = 100e6; // 100 USDC

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, amount, "USDC", "RWF");

        // Verify transfer was stored
        (
            address senderPsp,
            ,
            bytes32 recipientCommitment,
            uint256 storedAmount,
            string memory baseCurrency,
            string memory targetCurrency,
            ,
            ,
            PamojaEscrow.TransferStatus status
        ) = escrow.getTransfer(transferId);

        assertEq(senderPsp, pspRwanda);
        assertEq(recipientCommitment, RECIPIENT_COMMITMENT);
        assertEq(storedAmount, amount);
        assertEq(baseCurrency, "USDC");
        assertEq(targetCurrency, "RWF");
        assertEq(uint8(status), uint8(PamojaEscrow.TransferStatus.INITIATED));
        assertEq(escrow.totalTransfers(), 1);
    }

    function test_InitiateTransfer_RevertsIfNotPSP() public {
        bytes32 transferId = keccak256("transfer-002");

        vm.prank(makeAddr("randomUser"));
        vm.expectRevert(PamojaEscrow.NotAuthorized.selector);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 50e6, "USDC", "RWF");
    }

    function test_InitiateTransfer_RevertsOnDuplicateId() public {
        bytes32 transferId = keccak256("transfer-003");

        vm.startPrank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 50e6, "USDC", "RWF");

        vm.expectRevert(PamojaEscrow.TransferAlreadyExists.selector);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 50e6, "USDC", "RWF");
        vm.stopPrank();
    }

    function test_InitiateTransfer_RevertsOnZeroAmount() public {
        bytes32 transferId = keccak256("transfer-004");

        vm.prank(pspRwanda);
        vm.expectRevert(PamojaEscrow.ZeroAmount.selector);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 0, "USDC", "RWF");
    }

    function test_InitiateTransfer_EmitsEvent() public {
        bytes32 transferId = keccak256("transfer-005");
        uint256 amount = 200e6;

        vm.expectEmit(true, true, false, true);
        emit PamojaEscrow.TransferInitiated(
            transferId,
            pspRwanda,
            RECIPIENT_COMMITMENT,
            amount,
            "USDC",
            "RWF"
        );

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, amount, "USDC", "RWF");
    }

    // ── settleTransfer tests ─────────────────────────────────────────

    function test_SettleTransfer_ResolvesRecipientViaPSPRegistry() public {
        bytes32 transferId = keccak256("transfer-settle-001");

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 100e6, "USDC", "RWF");

        // Settle the transfer
        escrow.settleTransfer(transferId);

        // Verify it's settled
        assertTrue(escrow.isTransferSettled(transferId));
        assertEq(escrow.totalSettled(), 1);

        // Verify the transfer status
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            PamojaEscrow.TransferStatus status
        ) = escrow.getTransfer(transferId);
        assertEq(uint8(status), uint8(PamojaEscrow.TransferStatus.SETTLED));
    }

    function test_SettleTransfer_RevertsIfCommitmentNotLinked() public {
        bytes32 unlinkedCommitment = keccak256("unlinked_commitment");
        bytes32 transferId = keccak256("transfer-settle-002");

        vm.startPrank(pspRwanda);
        escrow.initiateTransfer(transferId, unlinkedCommitment, 100e6, "USDC", "RWF");

        vm.expectRevert(
            abi.encodeWithSelector(
                PamojaEscrow.RecipientNotResolved.selector,
                unlinkedCommitment
            )
        );
        escrow.settleTransfer(transferId);
        vm.stopPrank();
    }

    function test_SettleTransfer_RevertsIfTransferNotFound() public {
        bytes32 nonexistentId = keccak256("nonexistent");

        vm.expectRevert(PamojaEscrow.TransferNotFound.selector);
        escrow.settleTransfer(nonexistentId);
    }

    function test_SettleTransfer_RevertsIfAlreadySettled() public {
        bytes32 transferId = keccak256("transfer-settle-004");

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 100e6, "USDC", "RWF");

        escrow.settleTransfer(transferId);

        vm.expectRevert(PamojaEscrow.InvalidStatus.selector);
        escrow.settleTransfer(transferId);
    }

    function test_SettleTransfer_EmitsEventWithRate() public {
        bytes32 transferId = keccak256("transfer-settle-005");
        uint256 amount = 100e6;

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, amount, "USDC", "RWF");

        vm.expectEmit(true, true, false, true);
        emit PamojaEscrow.TransferSettled(
            transferId,
            pspKenya, // resolved recipient address
            pspKenya,
            RATE_1300,
            amount
        );

        escrow.settleTransfer(transferId);
    }

    // ── refundTransfer tests ─────────────────────────────────────────

    function test_RefundTransfer_RevertsIfTimeoutNotReached() public {
        bytes32 transferId = keccak256("transfer-refund-001");

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 100e6, "USDC", "RWF");

        // Try to refund immediately — should fail
        vm.expectRevert();
        escrow.refundTransfer(transferId);
    }

    function test_RefundTransfer_SucceedsAfterTimeout() public {
        bytes32 transferId = keccak256("transfer-refund-002");
        uint256 amount = 100e6;

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, amount, "USDC", "RWF");

        // Advance time past the 24-hour timeout
        vm.warp(block.timestamp + 24 hours + 1);

        // Refund should succeed (must be called by senderPsp)
        vm.prank(pspRwanda);
        vm.expectEmit(true, true, false, true);
        emit PamojaEscrow.TransferRefunded(transferId, pspRwanda, amount);

        escrow.refundTransfer(transferId);

        // Verify state
        assertTrue(escrow.totalRefunded() == 1);

        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            PamojaEscrow.TransferStatus status
        ) = escrow.getTransfer(transferId);
        assertEq(uint8(status), uint8(PamojaEscrow.TransferStatus.REFUNDED));
    }

    function test_RefundTransfer_RevertsIfNotSenderOrPSP() public {
        bytes32 transferId = keccak256("transfer-refund-003");

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 100e6, "USDC", "RWF");

        vm.warp(block.timestamp + 24 hours + 1);

        vm.prank(makeAddr("randomUser"));
        vm.expectRevert(PamojaEscrow.NotAuthorized.selector);
        escrow.refundTransfer(transferId);
    }

    function test_IsTransferRefundable_ReturnsTrueAfterTimeout() public {
        bytes32 transferId = keccak256("transfer-refund-004");

        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, 100e6, "USDC", "RWF");

        assertFalse(escrow.isTransferRefundable(transferId));

        vm.warp(block.timestamp + 24 hours + 1);

        assertTrue(escrow.isTransferRefundable(transferId));
    }

    // ── Full lifecycle test ───────────────────────────────────────────

    function test_FullLifecycle_InitiateSettle() public {
        bytes32 transferId = keccak256("lifecycle-001");
        uint256 amount = 500e6;

        // 1. Initiate
        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, amount, "USDC", "RWF");
        assertEq(escrow.totalTransfers(), 1);

        // 2. Settle
        escrow.settleTransfer(transferId);
        assertEq(escrow.totalSettled(), 1);
        assertTrue(escrow.isTransferSettled(transferId));
    }

    function test_FullLifecycle_InitiateRefund() public {
        bytes32 transferId = keccak256("lifecycle-002");
        uint256 amount = 500e6;

        // 1. Initiate
        vm.prank(pspRwanda);
        escrow.initiateTransfer(transferId, RECIPIENT_COMMITMENT, amount, "USDC", "RWF");

        // 2. Time passes
        vm.warp(block.timestamp + 24 hours + 1);

        // 3. Refund (must be called by senderPsp)
        vm.prank(pspRwanda);
        escrow.refundTransfer(transferId);
        assertEq(escrow.totalRefunded(), 1);
    }

    function test_MultipleTransfers_TrackedCorrectly() public {
        bytes32 id1 = keccak256("multi-001");
        bytes32 id2 = keccak256("multi-002");
        bytes32 id3 = keccak256("multi-003");

        vm.startPrank(pspRwanda);
        escrow.initiateTransfer(id1, RECIPIENT_COMMITMENT, 100e6, "USDC", "RWF");
        escrow.initiateTransfer(id2, RECIPIENT_COMMITMENT, 200e6, "USDC", "RWF");
        escrow.initiateTransfer(id3, RECIPIENT_COMMITMENT, 300e6, "USDC", "RWF");
        vm.stopPrank();

        assertEq(escrow.totalTransfers(), 3);

        // Settle two, refund one
        escrow.settleTransfer(id1);
        escrow.settleTransfer(id2);

        vm.warp(block.timestamp + 24 hours + 1);
        vm.prank(pspRwanda);
        escrow.refundTransfer(id3);

        assertEq(escrow.totalSettled(), 2);
        assertEq(escrow.totalRefunded(), 1);
    }
}
