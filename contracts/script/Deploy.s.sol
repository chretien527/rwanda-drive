// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LicenseRegistry} from "../src/LicenseRegistry.sol";
import {CredentialRegistry} from "../src/CredentialRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {PamojaPayAccessControl} from "../src/PamojaPayAccessControl.sol";
import {IPamojaPayAccessControl} from "../src/IPamojaPayAccessControl.sol";
import {PSPRegistry} from "../src/PSPRegistry.sol";
import {RateOracle} from "../src/RateOracle.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {PamojaEscrow} from "../src/PamojaEscrow.sol";
import {DisclosureRegistry} from "../src/DisclosureRegistry.sol";

/// @notice Deploys the full PamojaPay contract suite.
///
///   Environment variables:
///   - PLATFORM_SIGNER: KMS-backed relayer address (Ikizere contracts)
///   - GUARDIAN: multisig for emergency key rotation
///   - ADMIN: PamojaPay admin (can grant/revoke roles)
///   - ORACLE_FORWARDER: Chainlink CRE forwarder address
///   - MAX_STALENESS_SECONDS: max age for FX rates (e.g. 3600)
///   - BASE_CURRENCY: pool stablecoin (e.g. "USDC")
///
/// Usage:
///   forge script script/Deploy.s.sol:DeployPamojaPay \
///     --rpc-url base_sepolia --broadcast --verify
contract DeployPamojaPay is Script {
    function run() external {
        // ── Environment variables ──────────────────────────────────
        address platformSigner = vm.envAddress("PLATFORM_SIGNER");
        address guardian = vm.envAddress("GUARDIAN");
        address admin = vm.envAddress("ADMIN");
        address oracleForwarder = vm.envAddress("ORACLE_FORWARDER");
        uint256 maxStaleness = vm.envUint("MAX_STALENESS_SECONDS");
        string memory baseCurrency = vm.envString("BASE_CURRENCY");

        vm.startBroadcast();

        // ── Part A: Ikizere credential suite ──────────────────────
        LicenseRegistry licenseRegistry = new LicenseRegistry(platformSigner, guardian);
        CredentialRegistry credentialRegistry = new CredentialRegistry(platformSigner, guardian);
        AuditAnchor auditAnchor = new AuditAnchor(platformSigner, guardian);

        // ── Part B: PamojaPay settlement suite ────────────────────
        // 1. Access control (deploy once, shared by all PamojaPay contracts)
        PamojaPayAccessControl accessControl = new PamojaPayAccessControl(admin, guardian);

        // 2. Core registries
        PSPRegistry pspRegistry = new PSPRegistry(
            IPamojaPayAccessControl(address(accessControl))
        );

        RateOracle rateOracle = new RateOracle(
            IPamojaPayAccessControl(address(accessControl)),
            maxStaleness
        );

        DisclosureRegistry disclosureRegistry = new DisclosureRegistry(
            IPamojaPayAccessControl(address(accessControl))
        );

        // 3. Liquidity pool
        LiquidityPool liquidityPool = new LiquidityPool(
            IPamojaPayAccessControl(address(accessControl)),
            rateOracle,
            baseCurrency
        );

        // 4. Escrow (depends on AccessControl, RateOracle, PSPRegistry)
        PamojaEscrow escrow = new PamojaEscrow(
            IPamojaPayAccessControl(address(accessControl)),
            rateOracle,
            pspRegistry
        );

        // ── Grant operational roles ───────────────────────────────
        accessControl.grantRole(keccak256("ORACLE_ROLE"), oracleForwarder);

        vm.stopBroadcast();

        // ── Deployment summary ────────────────────────────────────
        console.log("=== Part A: Ikizere Credential Suite ===");
        console.log("LicenseRegistry:  ", address(licenseRegistry));
        console.log("CredentialRegistry:", address(credentialRegistry));
        console.log("AuditAnchor:      ", address(auditAnchor));
        console.log("");
        console.log("=== Part B: PamojaPay Settlement Suite ===");
        console.log("AccessControl:    ", address(accessControl));
        console.log("PSPRegistry:      ", address(pspRegistry));
        console.log("RateOracle:       ", address(rateOracle));
        console.log("LiquidityPool:    ", address(liquidityPool));
        console.log("DisclosureRegistry:", address(disclosureRegistry));
        console.log("PamojaEscrow:     ", address(escrow));
    }
}
