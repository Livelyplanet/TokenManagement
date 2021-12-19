// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IManagement.sol";
import "./ACL.sol";
import "./ERC165.sol";

import "./ERC20Token/ILivelyToken.sol";
import "hardhat/console.sol";

contract Management is ERC165, ACL, IManagement {
    int8 private constant _CONSENSUS_ACCEPTED_QUORUM_FULL = 100;
    int8 private constant _CONSENSUS_ACCEPTED_QUORUM_GT_60 = 60;
    int8 private constant _CONSENSUS_REJECTED_QUORUM_LT_20 = -20;

    // consensusId => ConsensusData
    // consensusId = hash(requestId)
    mapping(bytes32 => ConsensusData) private _consensuses;

    // action map to function selectors
    mapping(ActionType => bytes4) private _actionFuns;

    // role map to votes
    mapping(bytes32 => bool) private _votes;

    /// Function cannot be called at this time.
    error InvalidStageError();

    error IllegalConsensusIdError();

    error DuplicateRequestIdError();

    error IllegalRequestError();

    error IllegalArgumentError();

    error IllegalVoteError();

    // This is the current stage.
    ConsensusStage private _currentStage;

    uint256 private _voteStageTime;

    bytes32 private _currentConsensusId;

    uint256 private _voteDeadline;

    address private _livelyERC20Token;

    constructor(
        address livelyToken,
        address accountCTO,
        address accountCEO,
        address accountCOO,
        uint256 voteDeadline
    ) ACL(accountCTO, accountCEO, accountCOO) {
        if (livelyToken == address(0) || livelyToken == address(this) || !_validateLivelyTokenAddress(livelyToken))
            revert IllegalArgumentError();

        _voteDeadline = voteDeadline == 0 ? 8 days : voteDeadline;

        _initFunctionActions();

        _livelyERC20Token = livelyToken;
        _voteStageTime = 0;
        _currentStage = ConsensusStage.NONE_STAGE;
        _currentConsensusId = 0;
    }

    function getConsensusTime() external view override returns (uint256) {
        return _voteDeadline;
    }

    /**
     * @dev ERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC165, ACL) returns (bool) {
        return interfaceId == type(IManagement).interfaceId || super.supportsInterface(interfaceId);
    }

    function getCurrentConsensus() external view override returns (bytes32) {
        return _currentConsensusId;
    }

    function getConsensusStage() external view override returns (ConsensusStage) {
        return _currentStage;
    }

    /**
     * @dev initial function selector of lively token
     */
    function _initFunctionActions() private {
        _actionFuns[ActionType.GRANT_ROLE] = _getSelector("grantRole(bytes32,address,address)");
        _actionFuns[ActionType.REVOKE_ROLE] = _getSelector("revokeRole(bytes32,address)");
        _actionFuns[ActionType.MINT] = _getSelector("mint(address,uint256,uint256,uint256)");
        _actionFuns[ActionType.BURN] = _getSelector("burn(address,uint256,uint256,uint256)");
        _actionFuns[ActionType.PAUSE_ALL] = _getSelector("pauseAll()");
        _actionFuns[ActionType.UNPAUSE_ALL] = _getSelector("unpauseAll()");
        _actionFuns[ActionType.TRANSFER] = _getSelector("transferFromSec(address,address,uint256,uint256)");
        _actionFuns[ActionType.FREEZE] = _getSelector("freezeFrom(address,uint256,uint256");
        _actionFuns[ActionType.UNFREEZE] = _getSelector("unfreezeFrom(address,uint256,uint256)");
        _actionFuns[ActionType.PAUSE] = _getSelector("pause(address)");
        _actionFuns[ActionType.UNPAUSE] = _getSelector("unpause(address)");
        _actionFuns[ActionType.APPROVE] = _getSelector("approveSec(address,uint256,uint256)");
        _actionFuns[ActionType.WITHDRAWAL_BALANCE] = _getSelector("withdrawalBalance(address)");
        _actionFuns[ActionType.CHANGE_ROLE] = _getSelector("changeRole(bytes32,address,address)");
    }

    /**
     * @dev validate received lively token address
     */
    function _validateLivelyTokenAddress(address livelyToken) private view returns (bool) {
        return
            ILivelyToken(livelyToken).supportsInterface(type(IAccessControl).interfaceId) &&
            ILivelyToken(livelyToken).supportsInterface(type(IBurnable).interfaceId) &&
            ILivelyToken(livelyToken).supportsInterface(type(IMintable).interfaceId) &&
            ILivelyToken(livelyToken).supportsInterface(type(IFreezable).interfaceId) &&
            ILivelyToken(livelyToken).supportsInterface(type(IERC20).interfaceId) &&
            ILivelyToken(livelyToken).supportsInterface(type(IERC20Sec).interfaceId) &&
            ILivelyToken(livelyToken).supportsInterface(type(IPausable).interfaceId);
    }

    function _getSelector(string memory _func) private pure returns (bytes4) {
        return bytes4(keccak256(bytes(_func)));
    }

    modifier atStage(ConsensusStage _stage) {
        if (_currentStage != _stage) revert InvalidStageError();
        _;
    }

    function _nextStage() internal {
        _currentStage = ConsensusStage(uint256(_currentStage) + 1);
    }

    function _resetConsensus() internal {
        _currentStage = ConsensusStage.NONE_STAGE;
        _currentConsensusId = 0;
        _voteStageTime = 0;
        _votes[CTO_ROLE] = false;
        _votes[CEO_ROLE] = false;
        _votes[COO_ROLE] = false;
    }

    /**
     * @dev init consensus with recevied request from one of CTO, CEO, COO roles
     */
    function startConsensus(ConsensusRequest calldata request)
        external
        override
        validateSender
        atStage(ConsensusStage.NONE_STAGE)
        returns (bytes32)
    {
        if (request.id == 0) revert IllegalRequestError();

        // console.logBytes(abi.encodePacked(request.id));
        _currentConsensusId = keccak256(abi.encodePacked(request.id));
        // console.log("consensusId: ");
        // console.logBytes32(_currentConsensusId);
        if (_consensuses[_currentConsensusId].requestId != 0) revert DuplicateRequestIdError();

        if (
            request.optAccount1 == address(0) ||
            request.optAccount1 == address(this) ||
            request.optAccount2 == address(0) ||
            request.optAccount2 == address(this)
        ) revert IllegalRequestError();

        if (
            request.actionType == ActionType.GRANT_ROLE &&
            request.role != _ERC20_ADMIN_ROLE &&
            request.role != _ERC20_BURNABLE_ROLE &&
            request.role != CONSENSUS_ROLE
        ) {
            revert IllegalRoleError();
        } else if (
            request.actionType == ActionType.REVOKE_ROLE &&
            request.role != _ERC20_ADMIN_ROLE &&
            request.role != _ERC20_BURNABLE_ROLE
        ) {
            revert IllegalRoleError();
        } else if (
            request.actionType == ActionType.CHANGE_ROLE &&
            request.role != CTO_ROLE &&
            request.role != CEO_ROLE &&
            request.role != COO_ROLE
        ) {
            revert IllegalRoleError();
        }

        int8 votePercent = 0;
        bytes32 role = _roles[msg.sender];
        _votes[role] = true;
        if (role == CEO_ROLE) {
            votePercent = CEO_VOTE_PERECNT;
        } else {
            votePercent = OTHER_VOTE_PERECNT;
        }

        _consensuses[_currentConsensusId] = ConsensusData(
            request.id,
            request.actionType,
            ActionStatus.NONE,
            ConsensusStatus.VOTING,
            votePercent,
            msg.sender,
            request.optAccount1,
            request.optAccount2,
            request.role,
            request.amount
        );

        _voteStageTime = block.timestamp;
        _nextStage();
        emit ConsensusStarted(msg.sender, _currentConsensusId, request.actionType);
        return _currentConsensusId;
    }

    /**
     * @dev counting vote according to weight of vote of each role
     */
    function voteConsensus(bytes32 consensusId, bool vote)
        external
        override
        validateSender
        atStage(ConsensusStage.VOTE_STAGE)
    {
        ConsensusData storage data = _consensuses[consensusId];
        if (data.requestId == 0) revert IllegalConsensusIdError();

        bytes32 role = _roles[msg.sender];
        if (_votes[role]) revert IllegalVoteError();
        _votes[role] = true;

        unchecked {
            if (vote) {
                data.votePercent += (role == CEO_ROLE) ? CEO_VOTE_PERECNT : OTHER_VOTE_PERECNT;
            } else {
                data.votePercent -= (role == CEO_ROLE) ? CEO_VOTE_PERECNT : OTHER_VOTE_PERECNT;
            }
        }

        // Consensus with Quorum FULL
        if (
            data.actionType == ActionType.GRANT_ROLE ||
            data.actionType == ActionType.REVOKE_ROLE ||
            data.actionType == ActionType.MINT ||
            data.actionType == ActionType.BURN ||
            data.actionType == ActionType.PAUSE_ALL ||
            data.actionType == ActionType.UNPAUSE_ALL ||
            data.actionType == ActionType.TRANSFER ||
            data.actionType == ActionType.CHANGE_ROLE
        ) {
            if (data.votePercent == _CONSENSUS_ACCEPTED_QUORUM_FULL) {
                data.status = ConsensusStatus.ACCEPTED;
                data.actionStatus = ActionStatus.PENDING;
                _nextStage();
                emit ConsensusFinished(data.applicant, consensusId, data.status, data.actionType);
            } else if (!vote || block.timestamp >= _voteStageTime + _voteDeadline) {
                data.status = ConsensusStatus.REJECTED;
                _resetConsensus();
                emit ConsensusFinished(data.applicant, consensusId, data.status, data.actionType);
            }
            // Consensus with Quorum Max
        } else if (
            data.actionType == ActionType.FREEZE ||
            data.actionType == ActionType.UNFREEZE ||
            data.actionType == ActionType.PAUSE ||
            data.actionType == ActionType.UNPAUSE
        ) {
            if (data.votePercent > _CONSENSUS_ACCEPTED_QUORUM_GT_60) {
                data.status = ConsensusStatus.ACCEPTED;
                data.actionStatus = ActionStatus.PENDING;
                _nextStage();
                emit ConsensusFinished(data.applicant, consensusId, data.status, data.actionType);
            } else if (
                data.votePercent < _CONSENSUS_REJECTED_QUORUM_LT_20 || block.timestamp >= _voteStageTime + _voteDeadline
            ) {
                if (data.votePercent < 0) {
                    data.status = ConsensusStatus.REJECTED;
                    _resetConsensus();
                    emit ConsensusFinished(data.applicant, consensusId, data.status, data.actionType);
                } else {
                    data.status = ConsensusStatus.ACCEPTED;
                    data.actionStatus = ActionStatus.PENDING;
                    _nextStage();
                    emit ConsensusFinished(data.applicant, consensusId, data.status, data.actionType);
                }
            }
            // Consensus with Quorum > 60
        } else if (data.actionType == ActionType.APPROVE || data.actionType == ActionType.WITHDRAWAL_BALANCE) {
            if (data.votePercent > _CONSENSUS_ACCEPTED_QUORUM_GT_60) {
                data.status = ConsensusStatus.ACCEPTED;
                data.actionStatus = ActionStatus.PENDING;
                _nextStage();
                emit ConsensusFinished(data.applicant, consensusId, data.status, data.actionType);
            } else if (
                data.votePercent < _CONSENSUS_REJECTED_QUORUM_LT_20 || block.timestamp >= _voteStageTime + _voteDeadline
            ) {
                data.status = ConsensusStatus.REJECTED;
                _resetConsensus();
                emit ConsensusFinished(data.applicant, consensusId, data.status, data.actionType);
            }
        }
    }

    /**
     * @dev the function call target contract with specific action that consensus for it
     * optionalData1 and optionalData2 need for burn, mint and some acions
     */
    function runAction(
        bytes32 consensusId,
        uint256 optionalData1,
        uint256 optionalData2
    ) external override validateSender atStage(ConsensusStage.ACTION_STAGE) returns (bool, bytes memory) {
        ConsensusData storage consensusData = _consensuses[consensusId];
        if (consensusData.requestId == 0) revert IllegalConsensusIdError();
        bytes memory inputData;
        if (consensusData.actionType == ActionType.GRANT_ROLE) {
            inputData = abi.encodeWithSelector(
                _actionFuns[ActionType.GRANT_ROLE],
                consensusData.role,
                consensusData.optAccount1,
                consensusData.optAccount2
            );
        } else if (consensusData.actionType == ActionType.REVOKE_ROLE) {
            inputData = abi.encodeWithSelector(
                _actionFuns[ActionType.REVOKE_ROLE],
                consensusData.role,
                consensusData.optAccount1
            );
        } else if (
            consensusData.actionType == ActionType.FREEZE ||
            consensusData.actionType == ActionType.UNFREEZE ||
            consensusData.actionType == ActionType.APPROVE
        ) {
            inputData = abi.encodeWithSelector(
                _actionFuns[consensusData.actionType],
                consensusData.optAccount1,
                optionalData1,
                consensusData.amount
            );
        } else if (consensusData.actionType == ActionType.TRANSFER) {
            inputData = abi.encodeWithSelector(
                _actionFuns[ActionType.TRANSFER],
                consensusData.optAccount1,
                consensusData.optAccount2,
                optionalData1,
                consensusData.amount
            );
        } else if (consensusData.actionType == ActionType.MINT || consensusData.actionType == ActionType.BURN) {
            return _burnMintHandler(consensusData, optionalData1, optionalData2);
        } else if (
            consensusData.actionType == ActionType.PAUSE ||
            consensusData.actionType == ActionType.UNPAUSE ||
            consensusData.actionType == ActionType.WITHDRAWAL_BALANCE
        ) {
            inputData = abi.encodeWithSelector(_actionFuns[consensusData.actionType], consensusData.optAccount1);
        } else if (
            consensusData.actionType == ActionType.PAUSE_ALL || consensusData.actionType == ActionType.UNPAUSE_ALL
        ) {
            inputData = abi.encodeWithSelector(_actionFuns[consensusData.actionType]);
        } else if (consensusData.actionType == ActionType.CHANGE_ROLE) {
            inputData = abi.encodeWithSelector(
                _actionFuns[ActionType.CHANGE_ROLE],
                consensusData.role,
                consensusData.optAccount1,
                consensusData.optAccount2
            );

            (bool isSuccess, bytes memory resultCall) = address(this).call(inputData);
            consensusData.actionStatus = ActionStatus(isSuccess ? 1 : 0);
            _resetConsensus();
            emit ActionExecuted(
                msg.sender,
                consensusId,
                consensusData.actionType,
                consensusData.actionStatus,
                resultCall
            );
            return (isSuccess, resultCall);
        }

        (bool success, bytes memory result) = _forward(inputData);
        consensusData.actionStatus = ActionStatus(success ? 1 : 0);
        _resetConsensus();
        emit ActionExecuted(msg.sender, consensusId, consensusData.actionType, consensusData.actionStatus, result);
        return (success, result);
    }

    /**
     * @dev burn and mint functions require to target contract has beed paused
     * handler should be confident from it when forward burn or mint calls
     */
    function _burnMintHandler(
        ConsensusData storage consensusData,
        uint256 optionalData1,
        uint256 optionalData2
    ) private returns (bool success, bytes memory data) {
        bytes memory inputData = abi.encodeWithSelector(_getSelector("paused()"));
        (success, data) = _forward(inputData);
        if (!success) return (success, data);

        uint8 contractPause = _toUint8(data, 0);

        if (contractPause == 0) {
            inputData = abi.encodeWithSelector(_actionFuns[ActionType.PAUSE_ALL]);
            (success, data) = _forward(inputData);
            if (!success) return (success, data);
        }

        inputData = abi.encodeWithSelector(
            _actionFuns[consensusData.actionType],
            consensusData.optAccount1,
            optionalData1,
            optionalData2,
            consensusData.amount
        );
        (bool isSuccess, bytes memory result) = _forward(inputData);

        if (contractPause == 0) {
            inputData = abi.encodeWithSelector(_actionFuns[ActionType.UNPAUSE_ALL]);
            _forward(inputData);
        }

        return (isSuccess, result);
    }

    /**
     * @dev Forwards the call to the `target contarct`.
     */
    function _forward(bytes memory data) private returns (bool, bytes memory) {
        return _livelyERC20Token.call(data);
    }

    /**
     * @dev cancel current consensus by consensusId if specify consensus is active
     */
    function cancelConsensus(bytes32 consensusId) external override validateSender atStage(ConsensusStage.VOTE_STAGE) {
        ConsensusData storage consensusData = _consensuses[consensusId];
        if (consensusData.requestId == 0) revert IllegalConsensusIdError();
        if (consensusData.applicant != msg.sender) revert ForbiddenError(msg.sender);

        consensusData.status = ConsensusStatus.CANCELED;
        consensusData.actionStatus = ActionStatus.NONE;
        emit ConsensusCanceled(consensusData.applicant, consensusId, consensusData.actionType);
    }

    function cancelAction(bytes32 consensusId) external override validateSender atStage(ConsensusStage.ACTION_STAGE) {
        ConsensusData storage consensusData = _consensuses[consensusId];
        if (consensusData.requestId == 0) revert IllegalConsensusIdError();
        if (consensusData.applicant != msg.sender) revert ForbiddenError(msg.sender);

        consensusData.actionStatus = ActionStatus.CANCELED;
        emit ActionCanceled(consensusData.applicant, consensusId, consensusData.actionType);
    }

    /**
     * @dev return ConsensusData by consensusId
     */
    function getConsensusData(bytes32 consensusId) external view override returns (ConsensusData memory) {
        ConsensusData memory consensusData = _consensuses[consensusId];
        if (consensusData.requestId == 0) revert IllegalConsensusIdError();
        return consensusData;
    }

    /**
     * @dev return consensus status by consensusId
     */
    function getConsensusStatus(bytes32 consensusId) external view override returns (ConsensusStatus) {
        ConsensusData memory consensusData = _consensuses[consensusId];
        if (consensusData.requestId == 0) revert IllegalConsensusIdError();
        return consensusData.status;
    }

    /**
     * @dev convert bytes to unit8
     */
    function _toUint8(bytes memory data, uint256 start) private pure returns (uint8) {
        if (data.length < start + 1) revert IllegalArgumentError();
        uint8 tempUint;

        assembly {
            tempUint := mload(add(add(data, 0x1), start))
        }

        return tempUint;
    }
}
