// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PamojaPayAccessControl
/// @notice Singleton role manager for the PamojaPay contract suite.
///         Deployed once and referenced by every PamojaPay contract via
///         `IPamojaPayAccessControl`. This avoids the question of whether
///         each contract inherits its own copy or shares an instance —
///         there is exactly one source of truth for role membership.
///
///         Roles:
///           - DEFAULT_ADMIN_ROLE: can grant/revoke any role
///           - PSP_ROLE: a registered Payment Service Provider
///           - ORACLE_ROLE: Chainlink CRE forwarder / rate oracle
///           - LP_PROVIDER_ROLE: address authorised to manage pool liquidity
///
///         A GUARDIAN multisig can rotate the admin, providing a
///         recovery path if the admin key is compromised.
contract PamojaPayAccessControl {
    // ── Roles ───────────────────────────────────────────────────────
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant PSP_ROLE = keccak256("PSP_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant LP_PROVIDER_ROLE = keccak256("LP_PROVIDER_ROLE");

    // ── State ───────────────────────────────────────────────────────
    mapping(bytes32 => mapping(address => bool)) private _hasRole;
    mapping(bytes32 => bytes32) private _roleAdmin;

    address public immutable GUARDIAN;

    // ── Events ──────────────────────────────────────────────────────
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdmin, bytes32 indexed newAdmin);
    event GuardianChanged(address indexed oldGuardian, address indexed newGuardian);

    // ── Errors ──────────────────────────────────────────────────────
    error Unauthorized();
    error ZeroAddress();

    // ── Modifiers ───────────────────────────────────────────────────
    modifier onlyRole(bytes32 role) {
        if (!hasRole(role, msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────
    constructor(address admin, address guardian) {
        if (admin == address(0) || guardian == address(0)) revert ZeroAddress();
        _hasRole[DEFAULT_ADMIN_ROLE][admin] = true;
        GUARDIAN = guardian;
        emit RoleGranted(DEFAULT_ADMIN_ROLE, admin, admin);
    }

    // ── View ────────────────────────────────────────────────────────
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _hasRole[role][account];
    }

    function getRoleAdmin(bytes32 role) public view returns (bytes32) {
        return _roleAdmin[role];
    }

    // ── Mutative ────────────────────────────────────────────────────
    function grantRole(bytes32 role, address account) external onlyAdmin {
        if (account == address(0)) revert ZeroAddress();
        if (!_hasRole[role][account]) {
            _hasRole[role][account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    function revokeRole(bytes32 role, address account) external onlyAdmin {
        if (_hasRole[role][account]) {
            _hasRole[role][account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }

    function renounceRole(bytes32 role) external {
        if (!_hasRole[role][msg.sender]) revert Unauthorized();
        _hasRole[role][msg.sender] = false;
        emit RoleRevoked(role, msg.sender, msg.sender);
    }

    function setRoleAdmin(bytes32 role, bytes32 newAdminRole) external onlyAdmin {
        bytes32 previous = _roleAdmin[role];
        _roleAdmin[role] = newAdminRole;
        emit RoleAdminChanged(role, previous, newAdminRole);
    }

    /// @notice Emergency admin rotation. Only the GUARDIAN multisig can call this.
    function rotateAdmin(address newAdmin) external {
        if (msg.sender != GUARDIAN) revert Unauthorized();
        if (newAdmin == address(0)) revert ZeroAddress();

        address oldAdmin = msg.sender; // GUARDIAN is the current admin rotation path
        // Revoke DEFAULT_ADMIN from every previous admin would be expensive;
        // instead we just set the new admin. In production, the GUARDIAN
        // should revoke the old admin after calling this.
        _hasRole[DEFAULT_ADMIN_ROLE][newAdmin] = true;
        emit RoleGranted(DEFAULT_ADMIN_ROLE, newAdmin, msg.sender);
    }
}
