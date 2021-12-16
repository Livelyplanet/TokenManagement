// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/**
 * @dev Extension of {ERC20} that allows caller to freeze to token accounts
 * in a way that can be recognized off-chain (via event analysis).
 */
interface IFreezable {
    /**
     * @dev Emitted when the freeze of a `amount` for an `account` is set by
     * a call to {freeze}.
     * `amount` add to the freeze account and subtracted from balance of account.
     */
    event Freeze(address indexed sender, uint256 oldFreeze, uint256 amount);

    /**
     * @dev Emitted when the unfreeze of a `amount` for an `account` is set by
     * a call to {unfreeze}.
     * `amount` subtracted from the freeze account and add to balance of account.
     */
    event Unfreeze(address indexed sender, uint256 oldFreeze, uint256 amount);

    /**
     * @dev Emitted when the freeze of a `amount` for an `account` is set by
     * a call to {freezeFrom}.
     * `amount` add to the freeze account and subtracted from balance of account.
     */
    event FreezeFrom(
        address indexed sender,
        address indexed account,
        uint256 oldFreeze,
        uint256 amount
    );

    /**
     * @dev Emitted when the unfreeze of a `amount` for an `account` is set by
     * a call to {unfreezeFrom}.
     * `amount` subtracted from the freeze account and add to balance of account.
     */
    event UnfreezeFrom(
        address indexed sender,
        address indexed account,
        uint256 oldFreeze,
        uint256 amount
    );

    /**
     * @dev Freeze `amount` tokens from the caller account.
     *
     */
    function freeze(uint256 currentFreezeBalance, uint256 amount)
        external
        returns (uint256 newFreezeBalance);

    /**
     * @dev Unfreeze `amount` tokens from the caller account.
     *
     */
    function unfreeze(uint256 currentFreezeBalance, uint256 amount)
        external
        returns (uint256 newFreezeBalance);

    /**
     * @dev Freeze `amount` tokens from the account by caller.
     * the caller must send currentBalance of account
     *
     * Note: The freezFrom only called by authorized accounts
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` cannot be the contract address.
     */
    function freezeFrom(
        address account,
        uint256 currentFreezeBalance,
        uint256 amount
    ) external returns (uint256 newFreezeBalance);

    /**
     * @dev Unfreeze `amount` tokens from the account by caller.
     * the caller must send freezeBalance of account
     *
     * Note: The freezFrom only called by authorized accounts
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` cannot be the contract address.
     */
    function unfreezeFrom(
        address account,
        uint256 currentFreezeBalance,
        uint256 amount
    ) external returns (uint256 newFreezeBalance);

    /**
     * @dev Returns the amount of freeze tokens owned by `account`.
     */
    function freezeOf(address account) external view returns (uint256);
}
