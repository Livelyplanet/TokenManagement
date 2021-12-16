// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IManagement {
    enum ActionType {
        GRANT_ROLE, // Lively ERC20 Token, 100% quorum
        REVOKE_ROLE, // Lively ERC20 Token, 100% quorum
        MINT, // Lively ERC20 Token, 100% quorum
        BURN, // Lively ERC20 Token, 100% quorum
        PAUSE_ALL, // Lively ERC20 Token, 100% quorum
        UNPAUSE_ALL, // Lively ERC20 Token, 100% quorum
        TRANSFER, // Lively ERC20 Token, 100% quorum
        CHANGE_ROLE, // Token Management,   100% quorum
        FREEZE, // Lively ERC20 Token, max vote percent
        UNFREEZE, // Lively ERC20 Token, max vote percent
        PAUSE, // Lively ERC20 Token, max vote percent
        UNPAUSE, // Lively ERC20 Token, max vote percent
        APPROVE, // Lively ERC20 Token, gt 60% vote percent
        WITHDRAWAL_BALANCE // Lively ERC20 Token, gt 60% vote percent
    }

    enum ActionStatus {
        FAIL,
        SUCCESS,
        PENDING,
        NONE
    }

    enum ConsensusStatus {
        ACCEPTED,
        REJECTED,
        CANCELED,
        VOTING
    }

    struct ConsensusData {
        uint32 requestId;
        ActionType actionType;
        ActionStatus actionStatus;
        ConsensusStatus status;
        uint8 votePercent;
        address applicant;
        address optAccount1;
        address optAccount2;
        bytes32 role;
        uint256 amount;
    }

    struct Request {
        uint32 id;
        ActionType actionType;
        address optAccount1;
        address optAccount2;
        bytes32 role;
        uint256 amount;
    }

    event ConsensusStarted(
        address indexed applicant, 
        uint256 indexed consensusId, 
        ActionType indexed actionType
    );

    event ConsensusFinished(
        address indexed applicant, 
        uint256 indexed consensusId,
        ConsensusStatus indexed status,
        ActionType actionType
    );

    event ConsensusCanceled(
        address indexed applicant, 
        uint256 indexed consensusId, 
        ActionType indexed actionType
    );

    event ActionExecuted(
        address sender,
        uint256 indexed consensusId,
        ActionType indexed actionType,
        ActionStatus indexed status
    );

    function startConsensus(Request calldata request)
        external
        returns (uint256 consensusId);

    function commitVote(uint256 consensusId, bool vote) external;

    function cancelConsensus(uint256 consensusId) external;

    function getConsensusData(uint256 consensusId)
        external
        view
        returns (ConsensusData memory);

    function getConsensusStatus(uint256 consensusId)
        external
        view
        returns (ConsensusStatus);

    function runAction(uint256 consensusId, uint256 optionalData1, uint256 optionalData2)
        external
        returns (bool, bytes memory);
}
