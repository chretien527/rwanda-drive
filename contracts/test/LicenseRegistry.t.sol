// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LicenseRegistry} from "../src/LicenseRegistry.sol";
import {PlatformAccessControl} from "../src/PlatformAccessControl.sol";

contract LicenseRegistryTest is Test {
    LicenseRegistry registry;

    address platformSigner = makeAddr("platformSigner");
    address guardian = makeAddr("guardian");
    address randomUser = makeAddr("randomUser"); // simulates a driver/officer — should NEVER succeed

    function setUp() public {
        registry = new LicenseRegistry(platformSigner, guardian);
    }

    function test_OnlyPlatformCanIssueLicense() public {
        bytes32 leaf = keccak256("license-001");

        vm.prank(randomUser);
        vm.expectRevert(PlatformAccessControl.NotPlatform.selector);
        registry.issueLicense(leaf);
    }

    function test_PlatformCanIssueLicenseAndRootChanges() public {
        bytes32 leaf = keccak256("license-001");
        bytes32 rootBefore = registry.root();

        vm.prank(platformSigner);
        uint256 index = registry.issueLicense(leaf);

        assertEq(index, 0);
        assertTrue(registry.isIssued(leaf));
        assertNotEq(registry.root(), rootBefore);
    }

    function test_CannotIssueSameLeafTwice() public {
        bytes32 leaf = keccak256("license-001");

        vm.startPrank(platformSigner);
        registry.issueLicense(leaf);

        vm.expectRevert(LicenseRegistry.AlreadyIssued.selector);
        registry.issueLicense(leaf);
        vm.stopPrank();
    }

    function test_OnlyGuardianCanRotateSigner() public {
        address newSigner = makeAddr("newPlatformSigner");

        vm.prank(platformSigner); // signer cannot rotate itself
        vm.expectRevert(PlatformAccessControl.NotGuardian.selector);
        registry.updatePlatformSigner(newSigner);

        vm.prank(guardian);
        registry.updatePlatformSigner(newSigner);
        assertEq(registry.platformSigner(), newSigner);
    }

    function test_LeafIndexIncrementsSequentially() public {
        vm.startPrank(platformSigner);
        uint256 idx0 = registry.issueLicense(keccak256("license-A"));
        uint256 idx1 = registry.issueLicense(keccak256("license-B"));
        uint256 idx2 = registry.issueLicense(keccak256("license-C"));
        vm.stopPrank();

        assertEq(idx0, 0);
        assertEq(idx1, 1);
        assertEq(idx2, 2);
    }
}
