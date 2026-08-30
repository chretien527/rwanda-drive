// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPamojaPayAccessControl
/// @notice Interface for the shared PamojaPay role manager.
interface IPamojaPayAccessControl {
    // ── Errors ──────────────────────────────────────────────────────
    error Unauthorized();

    // ── View ────────────────────────────────────────────────────────
    function hasRole(bytes32 role, address account) external view returns (bool);
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
    function GUARDIAN() external view returns (address);
}
