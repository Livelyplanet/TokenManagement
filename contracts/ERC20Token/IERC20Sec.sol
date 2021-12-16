// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IERC20Sec {
    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}.
     * `value` is the new allowance and `oldValue` is the old allowance.
     */
    event ApprovalSec(
        address indexed owner,
        address indexed spender,
        uint256 oldAllowance,
        uint256 value
    );

    /**
     * @dev Emitted when increment the allowance of a `spender` for an `owner` is set by
     * a call to {increaseAllowanceSec}.
     * `value` is the increment current allowance.
     */
    event ApprovalIncSec(
        address indexed owner,
        address indexed spender,
        uint256 oldAllowance,
        uint256 value
    );

    /**
     * @dev Emitted when decrement the allowance of a `spender` for an `owner` is set by
     * a call to {decreaseAllowanceSec}.
     * `value` is the decrement current allowance.
     */
    event ApprovalDecSec(
        address indexed owner,
        address indexed spender,
        uint256 oldAllowance,
        uint256 value
    );

    /**
     * @dev Emitted when spender wants to transfer `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event TransferFromSec(
        address indexed sender,
        address indexed from,
        address indexed to,
        uint256 value
    );

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Note: If current allowance for spender is equal to currentAmount, then overwrite it
     * with value and return true, otherwise return false. it change current
     * amount with amount with Atomic "Compare And Set
     *
     * Emits an {ApprovalSec} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` cannot be the contract address.
     */
    function approveSec(
        address spender,
        uint256 currentAllowance,
        uint256 amount
    ) external returns (bool success);

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {ApprovalSec} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` cannot be the contract address.
     */
    function increaseAllowanceSec(
        address spender,
        uint256 currentAllowance,
        uint256 value
    ) external returns (bool);

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {ApprovalSec} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` cannot be the contract address.
     * - `spender` must have allowance for the caller of at least `value`.
     */
    function decreaseAllowanceSec(
        address spender,
        uint256 currentAllowance,
        uint256 value
    ) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {TransferFromSec} event.
     */
    function transferFromSec(
        address sender,
        address recipient,
        uint256 currentBalance,
        uint256 amount
    ) external returns (bool);
}
