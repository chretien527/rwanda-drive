// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PlatformAccessControl} from "./PlatformAccessControl.sol";

/// @title CredentialRegistry
/// @notice Live status (active / revoked / suspended) for issued digital
///         credentials — the QR credential itself, not the underlying
///         license record. This is what an officer's scan checks in real
///         time (§20–23 of the platform spec). Status changes are
///         triggered by admin actions in the Admin Portal (suspend
///         account, revoke compromised credential) and executed by the
///         platform's KMS signer — never by the driver or officer
///         directly.
contract CredentialRegistry is PlatformAccessControl {
    enum Status {
        NONE,
        ACTIVE,
        REVOKED,
        SUSPENDED
    }

    mapping(bytes32 => Status) public status; // credentialHash => status
    mapping(bytes32 => uint256) public lastUpdated; // credentialHash => timestamp

    event StatusChanged(bytes32 indexed credentialHash, Status oldStatus, Status newStatus, uint256 timestamp);

    constructor(address _platformSigner, address _guardian) PlatformAccessControl(_platformSigner, _guardian) {}

    /// @param credentialHash keccak256 identifier of the QR credential (not the license leaf hash —
    ///        these are distinct: a license can be validly issued in LicenseRegistry while its
    ///        associated credential is separately revoked here, e.g. "report compromised credential").
    function setStatus(bytes32 credentialHash, Status newStatus) external onlyPlatform {
        Status old = status[credentialHash];
        status[credentialHash] = newStatus;
        lastUpdated[credentialHash] = block.timestamp;
        emit StatusChanged(credentialHash, old, newStatus, block.timestamp);
    }

    function checkStatus(bytes32 credentialHash) external view returns (Status) {
        return status[credentialHash];
    }

    function isActive(bytes32 credentialHash) external view returns (bool) {
        return status[credentialHash] == Status.ACTIVE;
    }
}
