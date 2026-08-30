// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PamojaPayAccessControl} from "../src/PamojaPayAccessControl.sol";
import {IPamojaPayAccessControl} from "../src/IPamojaPayAccessControl.sol";
import {DisclosureRegistry} from "../src/DisclosureRegistry.sol";

contract DisclosureRegistryTest is Test {
    PamojaPayAccessControl accessControl;
    DisclosureRegistry disclosureRegistry;

    address admin;
    address pspAddress;
    address randomUser;

    bytes32 constant COMMITMENT_1 = keccak256("disclosure_commitment_001");
    bytes32 constant PURPOSE_HASH = keccak256("kyc_verification");

    function setUp() public {
        admin = makeAddr("admin");
        pspAddress = makeAddr("psp");
        randomUser = makeAddr("random");

        accessControl = new PamojaPayAccessControl(admin, makeAddr("guardian"));
        disclosureRegistry = new DisclosureRegistry(IPamojaPayAccessControl(address(accessControl)));
    }

    // ── Store disclosure ─────────────────────────────────────────────

    function test_StoreDisclosure_Success() public {
        bytes memory ciphertext = abi.encodePacked("encrypted_data_blob");

        disclosureRegistry.storeDisclosure(COMMITMENT_1, ciphertext, PURPOSE_HASH, pspAddress);

        assertTrue(disclosureRegistry.exists(COMMITMENT_1));
        assertEq(disclosureRegistry.totalDisclosures(), 1);
    }

    function test_StoreDisclosure_RevertsIfAlreadyExists() public {
        bytes memory ciphertext = abi.encodePacked("encrypted_data");

        disclosureRegistry.storeDisclosure(COMMITMENT_1, ciphertext, PURPOSE_HASH, pspAddress);

        vm.expectRevert(DisclosureRegistry.AlreadyExists.selector);
        disclosureRegistry.storeDisclosure(COMMITMENT_1, ciphertext, PURPOSE_HASH, pspAddress);
    }

    function test_StoreDisclosure_RevertsOnEmptyCiphertext() public {
        vm.expectRevert(DisclosureRegistry.EmptyCiphertext.selector);
        disclosureRegistry.storeDisclosure(COMMITMENT_1, "", PURPOSE_HASH, pspAddress);
    }

    function test_StoreDisclosure_EmitsEvent() public {
        bytes memory ciphertext = abi.encodePacked("encrypted_data");

        vm.expectEmit(true, true, true, true);
        emit DisclosureRegistry.DisclosureStored(
            COMMITMENT_1,
            PURPOSE_HASH,
            pspAddress,
            block.number
        );

        disclosureRegistry.storeDisclosure(COMMITMENT_1, ciphertext, PURPOSE_HASH, pspAddress);
    }

    // ── Get ciphertext ───────────────────────────────────────────────

    function test_GetCiphertext_Success() public {
        bytes memory ciphertext = abi.encodePacked("encrypted_data_blob");
        disclosureRegistry.storeDisclosure(COMMITMENT_1, ciphertext, PURPOSE_HASH, pspAddress);

        bytes memory retrieved = disclosureRegistry.getCiphertext(COMMITMENT_1);
        assertEq(retrieved, ciphertext);
    }

    function test_GetCiphertext_RevertsIfNotFound() public {
        vm.expectRevert(DisclosureRegistry.NotFound.selector);
        disclosureRegistry.getCiphertext(COMMITMENT_1);
    }

    function test_GetDisclosure_ReturnsFullMetadata() public {
        bytes memory ciphertext = abi.encodePacked("encrypted_data");
        disclosureRegistry.storeDisclosure(COMMITMENT_1, ciphertext, PURPOSE_HASH, pspAddress);

        (
            bytes memory storedCiphertext,
            bytes32 storedPurpose,
            address storedRequester,
            uint256 blockNum
        ) = disclosureRegistry.getDisclosure(COMMITMENT_1);

        assertEq(storedCiphertext, ciphertext);
        assertEq(storedPurpose, PURPOSE_HASH);
        assertEq(storedRequester, pspAddress);
        assertEq(blockNum, block.number);
    }

    // ── Set verifier ─────────────────────────────────────────────────

    function test_SetVerifier_Success() public {
        address newVerifier = makeAddr("verifier");

        vm.prank(admin);
        disclosureRegistry.setVerifier(newVerifier);

        assertEq(disclosureRegistry.verifierAddress(), newVerifier);
    }

    function test_SetVerifier_RevertsIfNotAdmin() public {
        address newVerifier = makeAddr("verifier");

        vm.prank(randomUser);
        vm.expectRevert("not admin");
        disclosureRegistry.setVerifier(newVerifier);
    }

    function test_SetVerifier_RevertsOnZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(DisclosureRegistry.ZeroAddress.selector);
        disclosureRegistry.setVerifier(address(0));
    }

    // ── Multiple disclosures ─────────────────────────────────────────

    function test_MultipleDisclosures_Independent() public {
        bytes32 commitment2 = keccak256("disclosure_commitment_002");
        bytes memory ciphertext1 = abi.encodePacked("data_1");
        bytes memory ciphertext2 = abi.encodePacked("data_2");
        bytes32 purpose2 = keccak256("transaction_verification");

        disclosureRegistry.storeDisclosure(COMMITMENT_1, ciphertext1, PURPOSE_HASH, pspAddress);
        disclosureRegistry.storeDisclosure(commitment2, ciphertext2, purpose2, makeAddr("regulator"));

        assertEq(disclosureRegistry.totalDisclosures(), 2);
        assertEq(disclosureRegistry.getCiphertext(COMMITMENT_1), ciphertext1);
        assertEq(disclosureRegistry.getCiphertext(commitment2), ciphertext2);
    }
}
