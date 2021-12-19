// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IAccessControl.sol";
import "./IBurnable.sol";
import "./IERC20.sol";
import "./IERC20Sec.sol";
import "./IFreezable.sol";
import "./IMintable.sol";
import "./IPausable.sol";
import "../IERC165.sol";

interface ILivelyToken is IAccessControl, IBurnable, IERC20, IERC20Sec, IFreezable, IMintable, IPausable, IERC165 {
    function withdrawalBalance(address recepient) external;
}
