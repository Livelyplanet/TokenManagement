// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/**
 * @dev External interface of AccessControl declared to support ERC165 detection.
 */
interface IAccessControl {
    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the CONSENSUS_ROLE account that originated
     * with the firstInitializeConsensusRole by an admin role
     *
     */
    event RoleGranted(
        bytes32 indexed role,
        address indexed sender,
        address indexed newAccount,
        address oldAccount
    );

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the CONSENSUS_ROLE account that originated
     *  with the firstInitializeConsensusRole by an admin role
     */
    event RoleRevoked(
        bytes32 indexed role,
        address indexed sender,
        address indexed account
    );

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s consensus role.
     */
    function grantRole(
        bytes32 role,
        address currentAccount,
        address newAccount
    ) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s consensus role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool);
}
