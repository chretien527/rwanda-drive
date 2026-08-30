// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PamojaPayAccessControl} from "../src/PamojaPayAccessControl.sol";
import {IPamojaPayAccessControl} from "../src/IPamojaPayAccessControl.sol";
import {RateOracle} from "../src/RateOracle.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";

contract LiquidityPoolTest is Test {
    PamojaPayAccessControl accessControl;
    RateOracle rateOracle;
    LiquidityPool liquidityPool;

    address admin;
    address lp1;
    address lp2;
    address randomUser;

    function setUp() public {
        admin = makeAddr("admin");
        lp1 = makeAddr("lp1");
        lp2 = makeAddr("lp2");
        randomUser = makeAddr("random");

        accessControl = new PamojaPayAccessControl(admin, makeAddr("guardian"));
        rateOracle = new RateOracle(IPamojaPayAccessControl(address(accessControl)), 1 hours);
        liquidityPool = new LiquidityPool(
            IPamojaPayAccessControl(address(accessControl)),
            rateOracle,
            "USDC"
        );

        vm.startPrank(admin);
        accessControl.grantRole(keccak256("LP_PROVIDER_ROLE"), lp1);
        accessControl.grantRole(keccak256("LP_PROVIDER_ROLE"), lp2);
        vm.stopPrank();
    }

    // ── Deposit ──────────────────────────────────────────────────────

    function test_Deposit_Success() public {
        uint256 amount = 100_000e6;

        vm.prank(lp1);
        liquidityPool.deposit(amount);

        assertEq(liquidityPool.totalLiquidity(), amount);
        (uint256 deposited,) = liquidityPool.getLPDeposit(lp1);
        assertEq(deposited, amount);
        assertEq(liquidityPool.getLPCount(), 1);
    }

    function test_Deposit_RevertsIfNotLP() public {
        vm.prank(randomUser);
        vm.expectRevert(LiquidityPool.NotLP.selector);
        liquidityPool.deposit(100e6);
    }

    function test_Deposit_RevertsOnZeroAmount() public {
        vm.prank(lp1);
        vm.expectRevert(LiquidityPool.ZeroAmount.selector);
        liquidityPool.deposit(0);
    }

    function test_Deposit_CumulativeFromSameLP() public {
        vm.startPrank(lp1);
        liquidityPool.deposit(100e6);
        liquidityPool.deposit(200e6);
        vm.stopPrank();

        assertEq(liquidityPool.totalLiquidity(), 300e6);
        (uint256 deposited,) = liquidityPool.getLPDeposit(lp1);
        assertEq(deposited, 300e6);
        // Should not add lp1 twice
        assertEq(liquidityPool.getLPCount(), 1);
    }

    function test_Deposit_MultipleLPs() public {
        vm.prank(lp1);
        liquidityPool.deposit(100e6);

        vm.prank(lp2);
        liquidityPool.deposit(200e6);

        assertEq(liquidityPool.totalLiquidity(), 300e6);
        assertEq(liquidityPool.getLPCount(), 2);
    }

    function test_Deposit_EmitsEvent() public {
        uint256 amount = 100e6;

        vm.expectEmit(true, false, false, true);
        emit LiquidityPool.LiquidityDeposited(lp1, amount, amount);

        vm.prank(lp1);
        liquidityPool.deposit(amount);
    }

    // ── Withdraw ─────────────────────────────────────────────────────

    function test_Withdraw_Success() public {
        vm.startPrank(lp1);
        liquidityPool.deposit(100e6);
        liquidityPool.withdraw(40e6);
        vm.stopPrank();

        assertEq(liquidityPool.totalLiquidity(), 60e6);
        (uint256 deposited,) = liquidityPool.getLPDeposit(lp1);
        assertEq(deposited, 60e6);
    }

    function test_Withdraw_RevertsIfNoDeposit() public {
        vm.prank(lp1);
        vm.expectRevert(LiquidityPool.NoDeposit.selector);
        liquidityPool.withdraw(10e6);
    }

    function test_Withdraw_RevertsIfInsufficientBalance() public {
        vm.startPrank(lp1);
        liquidityPool.deposit(100e6);

        vm.expectRevert();
        liquidityPool.withdraw(200e6);
        vm.stopPrank();
    }

    function test_Withdraw_RevertsOnZeroAmount() public {
        vm.startPrank(lp1);
        liquidityPool.deposit(100e6);

        vm.expectRevert(LiquidityPool.ZeroAmount.selector);
        liquidityPool.withdraw(0);
        vm.stopPrank();
    }

    function test_Withdraw_FullAmount() public {
        vm.startPrank(lp1);
        liquidityPool.deposit(100e6);
        liquidityPool.withdraw(100e6);
        vm.stopPrank();

        assertEq(liquidityPool.totalLiquidity(), 0);
        (uint256 deposited,) = liquidityPool.getLPDeposit(lp1);
        assertEq(deposited, 0);
    }

    function test_Withdraw_EmitsEvent() public {
        vm.startPrank(lp1);
        liquidityPool.deposit(100e6);

        vm.expectEmit(true, false, false, true);
        emit LiquidityPool.LiquidityWithdrawn(lp1, 40e6, 60e6);

        liquidityPool.withdraw(40e6);
        vm.stopPrank();
    }

    // ── View functions ───────────────────────────────────────────────

    function test_HasSufficientLiquidity() public {
        assertFalse(liquidityPool.hasSufficientLiquidity(100e6));

        vm.prank(lp1);
        liquidityPool.deposit(50e6);

        assertTrue(liquidityPool.hasSufficientLiquidity(50e6));
        assertFalse(liquidityPool.hasSufficientLiquidity(100e6));
    }

    function test_BaseCurrency() public {
        assertEq(liquidityPool.baseCurrency(), "USDC");
    }
}
