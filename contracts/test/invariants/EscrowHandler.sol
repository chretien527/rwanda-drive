// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IPamojaPayAccessControl} from "../../src/IPamojaPayAccessControl.sol";
import {PamojaPayAccessControl} from "../../src/PamojaPayAccessControl.sol";
import {PSPRegistry} from "../../src/PSPRegistry.sol";
import {RateOracle} from "../../src/RateOracle.sol";
import {LiquidityPool} from "../../src/LiquidityPool.sol";
import {PamojaEscrow} from "../../src/PamojaEscrow.sol";

/// @title EscrowHandler
/// @notice Bounded fuzz-action handler for invariant testing.
///         Only exposes transfer lifecycle actions (initiate, settle, refund)
///         to keep state bounded and invariants fast.
contract EscrowHandler is Test {
    PamojaEscrow public escrow;
    PSPRegistry public pspRegistry;
    RateOracle public rateOracle;
    LiquidityPool public liquidityPool;
    PamojaPayAccessControl public accessControl;

    address[] public pspAddresses;
    mapping(address => bool) public isPsp;

    mapping(bytes32 => bool) public linkedCommitments;

    uint256 private _idCounter;

    constructor(
        PamojaEscrow _escrow,
        PSPRegistry _pspRegistry,
        RateOracle _rateOracle,
        LiquidityPool _liquidityPool,
        PamojaPayAccessControl _accessControl
    ) {
        escrow = _escrow;
        pspRegistry = _pspRegistry;
        rateOracle = _rateOracle;
        liquidityPool = _liquidityPool;
        accessControl = _accessControl;
    }

    function _nextTransferId() internal returns (bytes32 id) {
        _idCounter++;
        id = keccak256(abi.encodePacked("tx", _idCounter));
    }

    function _refreshRates() internal {
        vm.prank(address(this));
        rateOracle.updateRate("USDC", "RWF", 1300 * 1e8);
        vm.prank(address(this));
        rateOracle.updateRate("USDC", "KES", 150 * 1e8);
        vm.prank(address(this));
        rateOracle.updateRate("USDC", "UGX", 3800 * 1e8);
    }

    // ── Setup helpers ────────────────────────────────────────────────

    function addPSP(address psp) external {
        if (!isPsp[psp]) {
            pspAddresses.push(psp);
            isPsp[psp] = true;
            bytes32 pspId = keccak256(abi.encodePacked(psp));
            vm.prank(address(this));
            pspRegistry.registerPSP(pspId, "TestPSP", "RW", psp);
            vm.prank(address(this));
            accessControl.grantRole(keccak256("PSP_ROLE"), psp);
        }
    }

    function linkCommitment(bytes32 commitment, address psp) public {
        if (!linkedCommitments[commitment]) {
            bytes32 pspId = keccak256(abi.encodePacked(psp));
            vm.prank(address(this));
            pspRegistry.linkRecipientCommitment(commitment, pspId);
            linkedCommitments[commitment] = true;
        }
    }

    function seedRate(string memory base, string memory target, uint256 rate) external {
        vm.prank(address(this));
        rateOracle.updateRate(base, target, rate);
    }

    function seedLiquidity(address lp, uint256 amount) external {
        vm.prank(address(this));
        accessControl.grantRole(keccak256("LP_PROVIDER_ROLE"), lp);
        vm.prank(lp);
        liquidityPool.deposit(amount);
    }

    // ── Fuzz-callable actions ────────────────────────────────────────

    function fuzz_initiateTransfer(
        uint8 pspIndex,
        uint256 amount,
        bytes32 recipientCommitment,
        uint8 currencyPair
    ) external {
        if (pspAddresses.length == 0) return;
        pspIndex = uint8(bound(pspIndex, 0, uint8(pspAddresses.length - 1)));
        address psp = pspAddresses[pspIndex];
        amount = bound(amount, 1e6, 100_000e6);

        string memory base;
        string memory target;
        if (currencyPair % 3 == 0) { base = "USDC"; target = "RWF"; }
        else if (currencyPair % 3 == 1) { base = "USDC"; target = "KES"; }
        else { base = "USDC"; target = "UGX"; }

        vm.prank(address(this));
        rateOracle.updateRate(base, target, 1300 * 1e8);
        linkCommitment(recipientCommitment, pspAddresses[0]);

        bytes32 transferId = _nextTransferId();
        vm.prank(psp);
        try escrow.initiateTransfer(transferId, recipientCommitment, amount, base, target) {} catch {}
    }

    function fuzz_settleTransfer() external {
        uint256 len = escrow.getTransferCount();
        if (len == 0) return;
        bytes32 transferId = escrow.getTransferIdAtIndex(len - 1);

        (, , , , , , , , PamojaEscrow.TransferStatus status) = escrow.getTransfer(transferId);
        if (status != PamojaEscrow.TransferStatus.INITIATED) return;

        _refreshRates();
        try escrow.settleTransfer(transferId) {} catch {}
    }

    function fuzz_refundTransfer() external {
        uint256 len = escrow.getTransferCount();
        if (len == 0) return;
        bytes32 transferId = escrow.getTransferIdAtIndex(len - 1);

        (, , , , , , , , PamojaEscrow.TransferStatus status) = escrow.getTransfer(transferId);
        if (status != PamojaEscrow.TransferStatus.INITIATED) return;

        vm.warp(block.timestamp + 24 hours + 1);
        _refreshRates();

        (address senderPsp, , , , , , , , ) = escrow.getTransfer(transferId);
        vm.prank(senderPsp);
        try escrow.refundTransfer(transferId) {} catch {}
    }
}
