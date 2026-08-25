// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LicenseRegistry} from "../src/LicenseRegistry.sol";
import {CredentialRegistry} from "../src/CredentialRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";

/// @notice Deploys the Ikizere contract suite.
///   - PLATFORM_SIGNER: the address derived from the backend's KMS key
///     (AWS KMS / GCP KMS). This is the ONLY address that will ever call
///     issueLicense / setStatus / anchorBatch. No end user, admin's
///     personal wallet, or driver ever holds this key.
///   - GUARDIAN: a separate multisig (e.g. a 2-of-3 Safe held by platform
///     operators) that can rotate PLATFORM_SIGNER if the KMS key is ever
///     rotated or suspected compromised. It has no other power.
///
/// Usage:
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url base_sepolia --broadcast --verify
contract Deploy is Script {
    function run() external {
        address platformSigner = vm.envAddress("PLATFORM_SIGNER");
        address guardian = vm.envAddress("GUARDIAN");

        vm.startBroadcast();

        LicenseRegistry licenseRegistry = new LicenseRegistry(
            platformSigner,
            guardian
        );
        CredentialRegistry credentialRegistry = new CredentialRegistry(
            platformSigner,
            guardian
        );
        AuditAnchor auditAnchor = new AuditAnchor(platformSigner, guardian);

        vm.stopBroadcast();

        console.log("LicenseRegistry deployed at:", address(licenseRegistry));
        console.log(
            "CredentialRegistry deployed at:",
            address(credentialRegistry)
        );
        console.log("AuditAnchor deployed at:", address(auditAnchor));
    }
}
