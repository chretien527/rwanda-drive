// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PlatformAccessControl
/// @notice Web2.5 access model: exactly one address (the platform's
///         KMS-backed relayer/signer) may call state-changing functions
///         on any Ikizere contract. Drivers and officers never hold keys
///         and never call these contracts directly — every write here is
///         triggered by an action in the app (admin issues a license,
///         admin revokes a credential, backend anchors an audit batch)
///         and executed on the user's behalf by the backend.
///
///         A separate `GUARDIAN` address (recommended: a multisig, held
///         by platform operators — NOT the same key as `platformSigner`)
///         can rotate the platform signer if the KMS key is ever
///         compromised or rotated for routine security hygiene. The
///         GUARDIAN itself never issues, revokes, or anchors anything —
///         it can only replace the signer.
abstract contract PlatformAccessControl {
    address public platformSigner;
    address public immutable GUARDIAN;

    event PlatformSignerUpdated(
        address indexed oldSigner,
        address indexed newSigner
    );

    error NotPlatform();
    error NotGuardian();
    error ZeroAddress();

    modifier onlyPlatform() {
        _onlyPlatform();
        _;
    }

    modifier onlyGuardian() {
        _onlyGuardian();
        _;
    }

    function _onlyPlatform() internal view {
        if (msg.sender != platformSigner) revert NotPlatform();
    }

    function _onlyGuardian() internal view {
        if (msg.sender != GUARDIAN) revert NotGuardian();
    }

    constructor(address _platformSigner, address _guardian) {
        if (_platformSigner == address(0) || _guardian == address(0))
            revert ZeroAddress();
        platformSigner = _platformSigner;
        GUARDIAN = _guardian;
        emit PlatformSignerUpdated(address(0), _platformSigner);
    }

    /// @notice Rotate the platform signer (e.g. KMS key rotation, or
    ///         emergency response to a suspected key compromise).
    ///         Only the GUARDIAN can do this — the signer cannot rotate
    ///         itself, so a compromised signer alone can't lock out or
    ///         re-appoint itself.
    function updatePlatformSigner(address newSigner) external onlyGuardian {
        if (newSigner == address(0)) revert ZeroAddress();
        emit PlatformSignerUpdated(platformSigner, newSigner);
        platformSigner = newSigner;
    }
}
