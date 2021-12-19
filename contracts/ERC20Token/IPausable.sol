// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IPausable {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address indexed sender, address indexed account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address indexed sender, address indexed account);

    /**
     * @dev Emitted when the pauseAll is triggered by `account`.
     */
    event PausedAll(address indexed sender);

    /**
     * @dev Emitted when the pauseAll is lifted by `account`.
     */
    event UnpausedAll(address indexed sender);

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The account must not be paused.
     */
    function pause(address account) external;

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The account must be paused.
     */
    function unpause(address account) external;

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function pauseAll() external;

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The account must be paused.
     */
    function unpauseAll() external;

    /**
     * @dev Returns true if the account is paused, and false otherwise.
     */
    function pausedOf(address account) external view returns (bool);

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() external view returns (bool);
}
