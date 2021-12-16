// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IACL.sol";
import "./ERC165.sol";

/**
 * @dev Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Only account that have a role's consensus role 
 * can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role is `CONSENSUS_ROLE`, which means
 * that only account with this role will be able to grant or revoke other
 * roles.
 *
 */
abstract contract ACL is IACL, ERC165 {
    bytes32 internal constant _ERC20_BURNABLE_ROLE = keccak256("BURNABLE_ROLE");
    bytes32 internal constant _ERC20_ADMIN_ROLE = keccak256("ADMIN_ROLE");


    bytes32 public constant CONSENSUS_ROLE = keccak256("CONSENSUS_ROLE");
    bytes32 public constant CTO_ROLE = keccak256("CTO_ROLE");
    bytes32 public constant CEO_ROLE = keccak256("CEO_ROLE");
    bytes32 public constant COO_ROLE = keccak256("COO_ROLE");

    uint8 public constant CEO_VOTE_PERECNT = 36;
    uint8 public constant OTHER_VOTE_PERECNT = 32;

    address public constant COO_ACCOUT = address(0x6C4bAEce12BA082917374e0c07F4277F22Db9C7F);
    address public constant CEO_ACCOUT = address(0xF15De12E770555D86CECE4b89a836C672Ca1cdA5);
    address public constant CTO_ACCOUT = address(0x5fEd6D7c6d4b78bC94c531aacf10e32572d30522);

    mapping(address => bytes32) internal _roles;

    /**
     * @dev error Unauthorized, caller hasn't privilage access
     */
    error UnauthorizedError(address account);

    /**
     * @dev error ForbiddenError, caller call method or action is forbidden
     */
    error ForbiddenError(address account);

    /**
     * @dev error AddressNotFoundError
     */
    error AddressNotFoundError(address account);

    /**
     * @dev error IllegalAddressError, caller destination account address is invalid
     */
    error IllegalAddressError(address account);

    /**
     * @dev error IllegalRoleError, Revoke role is invalid
     */
    error IllegalRoleError();

    /**
     * @dev error DublicateAddressRoleError
     */
    error DublicateAddressRoleError(address account);

    /**
     * @dev Grants `CTO_ROLE, `CEO_ROLE`, `COO_ROLE` to the specific accounts
     */
    constructor() {
        _roles[CTO_ACCOUT] = CTO_ROLE;
        _roles[CEO_ACCOUT] = CEO_ROLE;
        _roles[COO_ACCOUT] = COO_ROLE;
        _roles[address(this)] = CONSENSUS_ROLE;
    }

    /**
     * @dev Modifier that checks that a sender has a specific role. Reverts
     * with a UnauthorizedError(address account).
     */
    modifier validateSenderRole(bytes32 role) {
        if (!_checkRole(role, msg.sender)) revert UnauthorizedError(msg.sender);
        _;
    }

    /**
     * @dev Modifier that checks that a sender has a role. Reverts
     * with a UnauthorizedError(address account).
     */
    modifier validateSender() {
         if(_roles[msg.sender] == 0) revert UnauthorizedError(msg.sender);
        _;
    }

    /**
     * @dev Modifier that checks that a sender has a two specific roles. Reverts
     * with a UnauthorizedError(address account).
     */
    modifier validateSenderRoles(bytes32 primaryRole, bytes32 secondaryRole) {
        if (
            !_checkRole(primaryRole, msg.sender) &&
            !_checkRole(secondaryRole, msg.sender)
        ) revert UnauthorizedError(msg.sender);
        _;
    }

    /**
     * @dev Modifier that checks that an account must doesn't equal with two specific addresses.
     * Reverts with a IllegalAddressError(address account).
     */
    modifier validateAddress(address account) {
        if (account == address(0) || account == address(this))
            revert IllegalAddressError(account);
        _;
    }

    /**
     * @dev Modifier that checks that each of account must not equal with two specific addresses.
     * Reverts with a IllegalAddressError(address account).
     */
    modifier validateAddresses(address account1, address account2) {
        if (account1 == address(0) || account1 == address(this))
            revert IllegalAddressError(account1);
        if (account2 == address(0) || account2 == address(this))
            revert IllegalAddressError(account2);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IACL).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account)
        public
        view
        override
        returns (bool)
    {
        if (account == address(0)) revert IllegalAddressError(account);
        if (role == 0) return false;
        return _checkRole(role, account);
    }

    /**
     * @dev 
     */
    function changeRole(
        bytes32 role,
        address currentAccount,
        address newAccount
    )
        external
        override
        validateSenderRole(CONSENSUS_ROLE)
        validateAddresses(currentAccount, newAccount)
    {
        if (role == CONSENSUS_ROLE) revert ForbiddenError(currentAccount);
        if (_roles[newAccount] != 0) revert DublicateAddressRoleError(newAccount);

        bytes32 roleInfo = _roles[currentAccount];
        if (roleInfo == 0) revert AddressNotFoundError(currentAccount);
        if (roleInfo != role) revert IllegalRoleError();
        delete _roles[currentAccount];

        _roles[newAccount] = role;
        emit RoleChanged(role, msg.sender, newAccount, currentAccount);
    }

    /**
     * @dev return false if account hasn't any role.
     */
    function _checkRole(bytes32 role, address account)
        private
        view
        returns (bool)
    {
        return _roles[account] == role;
    }
}
