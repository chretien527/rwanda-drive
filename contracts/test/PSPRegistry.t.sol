// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PamojaPayAccessControl} from "../src/PamojaPayAccessControl.sol";
import {IPamojaPayAccessControl} from "../src/IPamojaPayAccessControl.sol";
import {PSPRegistry} from "../src/PSPRegistry.sol";

contract PSPRegistryTest is Test {
    PamojaPayAccessControl accessControl;
    PSPRegistry pspRegistry;

    address admin;
    address guardian;
    address pspAddress1;
    address pspAddress2;
    address randomUser;

    bytes32 constant PSP_ID_1 = keccak256("MTN_MoMo_RW");
    bytes32 constant PSP_ID_2 = keccak256("M_Pesa_KE");
    bytes32 constant COMMITMENT_1 = keccak256("commitment_001");

    function setUp() public {
        admin = makeAddr("admin");
        guardian = makeAddr("guardian");
        pspAddress1 = makeAddr("psp1");
        pspAddress2 = makeAddr("psp2");
        randomUser = makeAddr("random");

        accessControl = new PamojaPayAccessControl(admin, guardian);
        pspRegistry = new PSPRegistry(IPamojaPayAccessControl(address(accessControl)));
    }

    // ── Registration ─────────────────────────────────────────────────

    function test_RegisterPSP_Success() public {
        vm.prank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);

        assertTrue(pspRegistry.isPSPActive(PSP_ID_1));
        assertEq(pspRegistry.getPSPCount(), 1);

        // Check address mapping
        (string memory name, string memory country, address pspAddr, , ,) = pspRegistry.psps(PSP_ID_1);
        assertEq(name, "MTN MoMo");
        assertEq(country, "RW");
        assertEq(pspAddr, pspAddress1);
    }

    function test_RegisterPSP_RevertsIfNotAdmin() public {
        vm.prank(randomUser);
        vm.expectRevert("not admin");
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);
    }

    function test_RegisterPSP_RevertsIfAlreadyRegistered() public {
        vm.startPrank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);

        vm.expectRevert(PSPRegistry.AlreadyRegistered.selector);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);
        vm.stopPrank();
    }

    function test_RegisterPSP_RevertsOnZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(PSPRegistry.ZeroAddress.selector);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", address(0));
    }

    function test_RegisterPSP_EmitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit PSPRegistry.PSPRegistered(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);

        vm.prank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);
    }

    function test_RegisterMultiplePSPs() public {
        vm.startPrank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);
        pspRegistry.registerPSP(PSP_ID_2, "M-Pesa", "KE", pspAddress2);
        vm.stopPrank();

        assertEq(pspRegistry.getPSPCount(), 2);
        assertTrue(pspRegistry.isPSPActive(PSP_ID_1));
        assertTrue(pspRegistry.isPSPActive(PSP_ID_2));
    }

    // ── Status changes ───────────────────────────────────────────────

    function test_SetPSPStatus_SuspendAndReactivate() public {
        vm.startPrank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);
        assertEq(pspRegistry.totalActivePsps(), 1);

        pspRegistry.setPSPStatus(PSP_ID_1, PSPRegistry.PSPStatus.SUSPENDED);
        assertFalse(pspRegistry.isPSPActive(PSP_ID_1));
        assertEq(pspRegistry.totalActivePsps(), 0);

        pspRegistry.setPSPStatus(PSP_ID_1, PSPRegistry.PSPStatus.ACTIVE);
        assertTrue(pspRegistry.isPSPActive(PSP_ID_1));
        assertEq(pspRegistry.totalActivePsps(), 1);
        vm.stopPrank();
    }

    function test_SetPSPStatus_RevertsIfNotRegistered() public {
        vm.prank(admin);
        vm.expectRevert(PSPRegistry.NotRegistered.selector);
        pspRegistry.setPSPStatus(PSP_ID_1, PSPRegistry.PSPStatus.ACTIVE);
    }

    function test_SetPSPStatus_RevertsOnNoneStatus() public {
        vm.startPrank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);

        vm.expectRevert(PSPRegistry.InvalidStatus.selector);
        pspRegistry.setPSPStatus(PSP_ID_1, PSPRegistry.PSPStatus.NONE);
        vm.stopPrank();
    }

    // ── Recipient commitment resolution ──────────────────────────────

    function test_LinkAndResolveRecipientCommitment() public {
        vm.startPrank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);
        pspRegistry.linkRecipientCommitment(COMMITMENT_1, PSP_ID_1);
        vm.stopPrank();

        // Resolve should return the PSP's address
        address resolved = pspRegistry.resolveRecipient(COMMITMENT_1);
        assertEq(resolved, pspAddress1);
    }

    function test_ResolveRecipient_ReturnsZeroForUnlinked() public {
        bytes32 unlinked = keccak256("unlinked");
        address resolved = pspRegistry.resolveRecipient(unlinked);
        assertEq(resolved, address(0));
    }

    function test_LinkCommitment_RevertsIfAlreadyLinked() public {
        vm.startPrank(admin);
        pspRegistry.registerPSP(PSP_ID_1, "MTN MoMo", "RW", pspAddress1);
        pspRegistry.linkRecipientCommitment(COMMITMENT_1, PSP_ID_1);

        vm.expectRevert(PSPRegistry.CommitmentAlreadyLinked.selector);
        pspRegistry.linkRecipientCommitment(COMMITMENT_1, PSP_ID_1);
        vm.stopPrank();
    }

    function test_LinkCommitment_RevertsIfPSPNotRegistered() public {
        vm.prank(admin);
        vm.expectRevert(PSPRegistry.NotRegistered.selector);
        pspRegistry.linkRecipientCommitment(COMMITMENT_1, PSP_ID_1);
    }
}
