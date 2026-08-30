// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PamojaPayAccessControl} from "../src/PamojaPayAccessControl.sol";
import {IPamojaPayAccessControl} from "../src/IPamojaPayAccessControl.sol";
import {RateOracle} from "../src/RateOracle.sol";

contract RateOracleTest is Test {
    PamojaPayAccessControl accessControl;
    RateOracle rateOracle;

    address admin;
    address oracleForwarder;
    address randomUser;

    uint256 constant MAX_STALENESS = 1 hours;
    uint256 constant RATE_1300 = 1300 * 1e8;

    function setUp() public {
        admin = makeAddr("admin");
        oracleForwarder = makeAddr("oracleForwarder");
        randomUser = makeAddr("random");

        accessControl = new PamojaPayAccessControl(admin, makeAddr("guardian"));
        rateOracle = new RateOracle(IPamojaPayAccessControl(address(accessControl)), MAX_STALENESS);

        vm.prank(admin);
        accessControl.grantRole(keccak256("ORACLE_ROLE"), oracleForwarder);
    }

    // ── Update rate ──────────────────────────────────────────────────

    function test_UpdateRate_Success() public {
        vm.prank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);

        uint256 rate = rateOracle.getRate("USDC", "RWF");
        assertEq(rate, RATE_1300);
    }

    function test_UpdateRate_RevertsIfNotOracle() public {
        vm.prank(randomUser);
        vm.expectRevert(PamojaPayAccessControl.Unauthorized.selector);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);
    }

    function test_UpdateRate_RevertsOnZeroRate() public {
        vm.prank(oracleForwarder);
        vm.expectRevert(RateOracle.InvalidRate.selector);
        rateOracle.updateRate("USDC", "RWF", 0);
    }

    function test_UpdateRate_EmitsEvent() public {
        bytes32 pairHash = keccak256(abi.encode("USDC", "RWF"));

        vm.expectEmit(true, false, false, true);
        emit RateOracle.RateUpdated(pairHash, "USDC", "RWF", RATE_1300);

        vm.prank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);
    }

    function test_UpdateRate_OverwritesPreviousRate() public {
        uint256 newRate = 1350 * 1e8;

        vm.startPrank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);
        rateOracle.updateRate("USDC", "RWF", newRate);
        vm.stopPrank();

        assertEq(rateOracle.getRate("USDC", "RWF"), newRate);
    }

    // ── Staleness ────────────────────────────────────────────────────

    function test_GetRate_RevertsIfStale() public {
        vm.prank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);

        // Advance time beyond max staleness
        vm.warp(block.timestamp + MAX_STALENESS + 1);

        vm.expectRevert();
        rateOracle.getRate("USDC", "RWF");
    }

    function test_GetRate_RevertsIfNotSet() public {
        vm.expectRevert();
        rateOracle.getRate("USDC", "RWF");
    }

    function test_IsRateFresh_ReturnsCorrectly() public {
        vm.prank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);

        assertTrue(rateOracle.isRateFresh("USDC", "RWF"));

        vm.warp(block.timestamp + MAX_STALENESS + 1);

        assertFalse(rateOracle.isRateFresh("USDC", "RWF"));
    }

    function test_GetRateWithTimestamp_ReturnsRateAndTime() public {
        vm.prank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);

        (uint256 rate, uint256 timestamp) = rateOracle.getRateWithTimestamp("USDC", "RWF");
        assertEq(rate, RATE_1300);
        assertEq(timestamp, block.timestamp);
    }

    // ── Admin functions ──────────────────────────────────────────────

    function test_SetMaxStaleness_Success() public {
        uint256 newMaxStaleness = 30 minutes;

        vm.prank(admin);
        rateOracle.setMaxStaleness(newMaxStaleness);

        assertEq(rateOracle.maxStalenessSeconds(), newMaxStaleness);
    }

    function test_SetMaxStaleness_RevertsIfNotAdmin() public {
        vm.prank(randomUser);
        vm.expectRevert(PamojaPayAccessControl.Unauthorized.selector);
        rateOracle.setMaxStaleness(30 minutes);
    }

    function test_SetMaxStaleness_EmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit RateOracle.MaxStalenessUpdated(MAX_STALENESS, 30 minutes);

        vm.prank(admin);
        rateOracle.setMaxStaleness(30 minutes);
    }

    // ── Multiple pairs ───────────────────────────────────────────────

    function test_MultiplePairs_IndependentRates() public {
        uint256 rateKES = 150 * 1e8;
        uint256 rateUGX = 3800 * 1e8;

        vm.startPrank(oracleForwarder);
        rateOracle.updateRate("USDC", "RWF", RATE_1300);
        rateOracle.updateRate("USDC", "KES", rateKES);
        rateOracle.updateRate("USDC", "UGX", rateUGX);
        vm.stopPrank();

        assertEq(rateOracle.getRate("USDC", "RWF"), RATE_1300);
        assertEq(rateOracle.getRate("USDC", "KES"), rateKES);
        assertEq(rateOracle.getRate("USDC", "UGX"), rateUGX);
    }
}
