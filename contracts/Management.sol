// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IManagement.sol";
import "./ACL.sol";
import "./ERC165.sol";

import "./ERC20Token/IAccessControl.sol";
import "./ERC20Token/IBurnable.sol";
import "./ERC20Token/IERC20.sol";
import "./ERC20Token/IERC20Sec.sol";
import "./ERC20Token/IFreezable.sol";
import "./ERC20Token/IMintable.sol";
import "./ERC20Token/IPausable.sol";

contract Management is ERC165, ACL, IManagement {

    /*
     * Consensus States     
     */
    enum ConsensusStage {
        NONE_STAGE,
        VOTE_STAGE,
        ACTION_STAGE
    }

    // consensusId => ConsensusData
    // consensusId = hash(requestId)
    mapping(uint256 => ConsensusData) private _consensuses;

    // action map to function selectors 
    mapping(ActionType => bytes4) private _actionFuns;

    /// Function cannot be called at this time.
    error InvalidStageError();

    error IllegalConsensusIdError();

    error DuplicateRequestIdError();

    error IllegalRequestError();

    error IllegalArgumentError();

    error IllegalRoleError();

    // This is the current stage.
    ConsensusStage private _currentStage;
    
    uint256 private _voteStageTime;

    address private _livelyERC20Token;

    constructor(address livelyToken) {
        if (
            livelyToken == address(0) ||
            livelyToken == address(this) ||
            !_validateLivelyTokenAddress(livelyToken)
        ) revert IllegalArgumentError();

        _initFunctionActions();

        _livelyERC20Token = livelyToken;
        _voteStageTime = 0;
        _currentStage = ConsensusStage.NONE_STAGE;
    }

    /**
     * @dev ERC165
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC165, ACL)
        returns (bool)
    {
        return interfaceId == type(IManagement).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev initial function selector of lively token
     */
    function _initFunctionActions() private {
        _actionFuns[ActionType.GRANT_ROLE] = _getSelector(
            "grantRole(bytes32,address,address)"
        );
        _actionFuns[ActionType.REVOKE_ROLE] = _getSelector(
            "revokeRole(bytes32,address)"
        );
        _actionFuns[ActionType.MINT] = _getSelector(
            "mint(address,uint256,uint256,uint256)"
        );
        _actionFuns[ActionType.BURN] = _getSelector(
            "burn(address,uint256,uint256,uint256)"
        );
        _actionFuns[ActionType.PAUSE_ALL] = _getSelector("pauseAll()");
        _actionFuns[ActionType.UNPAUSE_ALL] = _getSelector("unpauseAll()");
        _actionFuns[ActionType.TRANSFER] = _getSelector(
            "transferFromSec(address,address,uint256,uint256)"
        );
        _actionFuns[ActionType.FREEZE] = _getSelector(
            "freezeFrom(address,uint256,uint256"
        );
        _actionFuns[ActionType.UNFREEZE] = _getSelector(
            "unfreezeFrom(address,uint256,uint256)"
        );
        _actionFuns[ActionType.PAUSE] = _getSelector("pause(address)");
        _actionFuns[ActionType.UNPAUSE] = _getSelector("unpause(address)");
        _actionFuns[ActionType.APPROVE] = _getSelector(
            "approveSec(address,uint256,uint256)"
        );
        _actionFuns[ActionType.WITHDRAWAL_BALANCE] = _getSelector(
            "withdrawalBalance(address)"
        );
        _actionFuns[ActionType.CHANGE_ROLE] = _getSelector(
            "changeRole(bytes32,address,address)"
        );
    }

    /**
     * @dev validate received lively token address
     */
    function _validateLivelyTokenAddress(address livelyToken)
        private
        returns (bool)
    {
        return
            IERC165(livelyToken).supportsInterface(type(IAccessControl).interfaceId) &&
            IERC165(livelyToken).supportsInterface(type(IBurnable).interfaceId) &&
            IERC165(livelyToken).supportsInterface(type(IMintable).interfaceId) &&
            IERC165(livelyToken).supportsInterface(type(IFreezable).interfaceId) &&
            IERC165(livelyToken).supportsInterface(type(IERC20).interfaceId) &&
            IERC165(livelyToken).supportsInterface(type(IERC20Sec).interfaceId);
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
        _voteStageTime = 0;
    }

    /**
     * @dev init consensus with recevied request from one of CTO, CEO, COO roles
     */
    function startConsensus(Request calldata request)
        external
        override
        validateSender
        atStage(ConsensusStage.NONE_STAGE)
        returns (uint256 consensusId)
    {
        if (request.id == 0) revert IllegalRequestError();

        consensusId = uint256(keccak256(abi.encode(request.id)));
        if (_consensuses[consensusId].requestId != 0)
            revert DuplicateRequestIdError();

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
        // else if (
        //     request.actionType != ActionType.FREEZE &&
        //     request.actionType != ActionType.UNFREEZE &&
        //     request.actionType != ActionType.MINT &&
        //     request.actionType != ActionType.BURN &&
        //     request.actionType != ActionType.PAUSE &&
        //     request.actionType != ActionType.UNPAUSE &&
        //     request.actionType != ActionType.PAUSE_ALL &&
        //     request.actionType != ActionType.TRANSFER &&
        //     request.actionType != ActionType.APPROVE &&
        //     request.actionType != ActionType.WITHDRAW_BALANCE &&
        //     request.actionType != ActionType.UPDATE_CONTRACT
        // ) revert IllegalRequestError();

        uint8 votePercent = 0;
        bytes32 role = _roles[msg.sender];

        if (role == CTO_ROLE) {
            votePercent = CEO_VOTE_PERECNT;
        } else {
            votePercent = OTHER_VOTE_PERECNT;
        }

        _consensuses[consensusId] = ConsensusData(
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
        emit ConsensusStarted(msg.sender, consensusId, request.actionType);
        return consensusId;
    }

    /**
     * @dev counting vote according to weight of vote of each role   
     */
    function commitVote(uint256 consensusId, bool vote)
        external
        override
        validateSender
        atStage(ConsensusStage.VOTE_STAGE)
    {
        ConsensusData storage data = _consensuses[consensusId];
        if (data.requestId == 0) revert IllegalConsensusIdError();

        bytes32 role = _roles[data.applicant];
        if (role == CEO_ROLE) {
            data.votePercent += OTHER_VOTE_PERECNT;
        } else {
            data.votePercent += CEO_VOTE_PERECNT;
        }

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
            if (data.votePercent == 100) {
                data.status = ConsensusStatus.ACCEPTED;
                data.actionStatus = ActionStatus.PENDING;
                _nextStage();
                emit ConsensusFinished(
                    data.applicant, 
                    consensusId, 
                    data.status, 
                    data.actionType
                );
            } else if (block.timestamp > _voteStageTime + 7 days) {
                data.status = ConsensusStatus.REJECTED;
                _resetConsensus();
                emit ConsensusFinished(
                    data.applicant, 
                    consensusId, 
                    data.status, 
                    data.actionType
                );
            }
        } else if (
            data.actionType == ActionType.FREEZE ||
            data.actionType == ActionType.UNFREEZE ||
            data.actionType == ActionType.PAUSE ||
            data.actionType == ActionType.UNPAUSE
        ) {
            if (
                data.votePercent > 60 ||
                block.timestamp > _voteStageTime + 7 days
            ) {
                data.status = ConsensusStatus.ACCEPTED;
                data.actionStatus = ActionStatus.PENDING;
                _nextStage();
                emit ConsensusFinished(
                    data.applicant, 
                    consensusId, 
                    data.status, 
                    data.actionType
                );
            } else {
                data.status = ConsensusStatus.REJECTED;
                _resetConsensus();
                emit ConsensusFinished(
                    data.applicant, 
                    consensusId, 
                    data.status, 
                    data.actionType
                );
            }
        } else if (
            data.actionType == ActionType.APPROVE ||
            data.actionType == ActionType.WITHDRAWAL_BALANCE
        ) {
            if (data.votePercent > 60) {
                data.status = ConsensusStatus.ACCEPTED;
                data.actionStatus = ActionStatus.PENDING;
                _nextStage();
                emit ConsensusFinished(
                    data.applicant, 
                    consensusId, 
                    data.status, 
                    data.actionType
                );
            } else if (block.timestamp > _voteStageTime + 7 days) {
                data.status = ConsensusStatus.REJECTED;
                _resetConsensus();
                emit ConsensusFinished(
                    data.applicant, 
                    consensusId, 
                    data.status, 
                    data.actionType
                );
            }
        }
    }

    /**
     * @dev the function call target contract with specific action that consensus for it
     * optionalData1 and optionalData2 need for burn, mint and some acions
     */
    function runAction(
        uint256 consensusId,
        uint256 optionalData1,
        uint256 optionalData2
    )
        external
        override
        validateSender
        atStage(ConsensusStage.ACTION_STAGE)
        returns (bool, bytes memory)
    {
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
        } else if (
            consensusData.actionType == ActionType.MINT ||
            consensusData.actionType == ActionType.BURN
        ) {
            return _burnMintHandler(consensusData, optionalData1, optionalData2);
        } else if (
            consensusData.actionType == ActionType.PAUSE ||
            consensusData.actionType == ActionType.UNPAUSE ||
            consensusData.actionType == ActionType.WITHDRAWAL_BALANCE
        ) {
            inputData = abi.encodeWithSelector(
                _actionFuns[consensusData.actionType],
                consensusData.optAccount1
            );
        } else if (
            consensusData.actionType == ActionType.PAUSE_ALL ||
            consensusData.actionType == ActionType.UNPAUSE_ALL
        ) {
            inputData = abi.encodeWithSelector(
                _actionFuns[consensusData.actionType]
            );
        } else {             
            // msg.sender = this;
            inputData = abi.encodeWithSelector(
                _actionFuns[ActionType.CHANGE_ROLE],
                consensusData.role,
                consensusData.optAccount1,
                consensusData.optAccount2
            );
            
            (bool isSuccess, bytes memory resultCall) = address(this).call(
                inputData
            );
            consensusData.actionStatus = ActionStatus(isSuccess ? 1 : 0);
            _resetConsensus();
            return (isSuccess, resultCall);
        }

        (bool success, bytes memory result) = _forward(inputData);
        consensusData.actionStatus = ActionStatus(success ? 1 : 0);
        _resetConsensus();
        return (success, result);
    }

    /**
     * @dev burn and mint functions require to target contract has beed paused
     * handler should be confident from it when forward burn or mint calls   
     */
    function _burnMintHandler(ConsensusData storage consensusData, uint256 optionalData1, uint256 optionalData2) 
        private 
        returns (bool success, bytes memory data) 
    {
        bytes memory inputData = abi.encodeWithSelector(_getSelector("paused()"));
        (success,data) = _forward(inputData);
        if (!success) return (success,data);

        uint8 contractPause = _toUint8(data, 0);
        
        if (contractPause == 0) {
            inputData = abi.encodeWithSelector(_actionFuns[ActionType.PAUSE_ALL]);
            (success,data) = _forward(inputData);
            if (!success) return (success,data);
        }

        inputData = abi.encodeWithSelector(
                _actionFuns[consensusData.actionType],
                consensusData.optAccount1,
                optionalData1,
                optionalData2,
                consensusData.amount
        );
        (bool isSuccess, bytes memory result)  = _forward(inputData);

        if (contractPause == 0) {
            inputData = abi.encodeWithSelector(_actionFuns[ActionType.UNPAUSE_ALL]);
            _forward(inputData);
        }

        return(isSuccess, result);
    }

    /**
     * @dev Forwards the call to the `target contarct`.
     */
    function _forward(bytes memory data) private returns (bool, bytes memory) {
        uint256 size = data.length;
        assembly {
            // loading state variable to stack
            let addr := sload(_livelyERC20Token.slot)

            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            // calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := call(gas(), addr, 0, data, size, 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(1, returndatasize())
            }
        }
    }

    /**
     * @dev cancel current consensus by consensusId if specify consensus is active
     */
    function cancelConsensus(uint256 consensusId)
        external
        override
        validateSender        
    {
        if (_currentStage == ConsensusStage.NONE_STAGE) revert InvalidStageError();

        ConsensusData storage consensusData = _consensuses[consensusId];
        if (consensusData.requestId == 0) revert IllegalConsensusIdError();

        consensusData.status = ConsensusStatus.CANCELED;
        consensusData.actionStatus = ActionStatus.NONE;
        emit ConsensusCanceled(
            consensusData.applicant, 
            consensusId, 
            consensusData.actionType
        );
    }

    /**
     * @dev return ConsensusData by consensusId
     */
    function getConsensusData(uint256 consensusId)
        external
        view
        override
        returns (ConsensusData memory) 
    {
        ConsensusData memory consensusData = _consensuses[consensusId];
        if (consensusData.requestId == 0) revert IllegalConsensusIdError();
        return consensusData;
    }

    /**
     * @dev return consensus status by consensusId
     */
    function getConsensusStatus(uint256 consensusId)
        external
        view
        override
        returns (ConsensusStatus)
    {
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
