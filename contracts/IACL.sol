// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/**
 * @dev External interface of AccessControl declared to support ERC165 detection.
 */
interface IACL {
    /**
     * @dev Emitted when `account` changed `role`.
     */
    event RoleChanged(bytes32 indexed role, address indexed sender, address indexed newAccount, address oldAccount);

    /**
     * @dev Substitude currentAccount of role to newAccount.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s consensus role.
     */
    function changeRole(
        bytes32 role,
        address currentAccount,
        address newAccount
    ) external;

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);
}
