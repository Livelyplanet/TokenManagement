// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IMintable {
    /**
     * @dev Emitted when the mint of a `amount` for an `account` is set by
     * a call to {mint}.
     * `amount` add to the totalSupply and balance of account.
     */
    event Mint(
        address indexed sender,
        address indexed account,
        uint256 oldBalance,
        uint256 oldTotalSupply,
        uint256 amount
    );

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply. first check currentTotalSupply with token's totalSupply then
     * add amount to token's totalSupply
     *
     * Emits a {Mint} event.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` cannot be the contract address.
     */
    function mint(
        address account,
        uint256 currentAccountBalance,
        uint256 currentTotalSupply,
        uint256 amount
    ) external;
}
