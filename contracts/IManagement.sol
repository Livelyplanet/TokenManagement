// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IManagement {
    /**
     * @dev Consensus Action types
     */
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

    /**
     * @dev Action status
     */
    enum ActionStatus {
        SUCCESS,
        PENDING,
        CANCELED,
        NONE
    }

    /**
     * @dev Consensus status
     */
    enum ConsensusStatus {
        ACCEPTED,
        REJECTED,
        CANCELED,
        VOTING
    }

    /**
     * @dev Consensus States
     */
    enum ConsensusStage {
        NONE_STAGE,
        VOTE_STAGE,
        ACTION_STAGE
    }

    /**
     * @dev Consensus store data
     */
    struct ConsensusData {
        uint32 requestId;
        ActionType actionType;
        ActionStatus actionStatus;
        ConsensusStatus status;
        int8 votePercent;
        address applicant;
        address optAccount1;
        address optAccount2;
        bytes32 role;
        uint256 amount;
    }

    /**
     * @dev Consensus Request by any role
     */
    struct ConsensusRequest {
        uint32 id;
        ActionType actionType;
        address optAccount1;
        address optAccount2;
        bytes32 role;
        uint256 amount;
    }

    /**
     * @dev Consensus started event
     */
    event ConsensusStarted(
        address indexed applicant,
        bytes32 indexed consensusId,
        ActionType indexed actionType
    );

    /**
     * @dev Consensus finished event
     */
    event ConsensusFinished(
        address indexed applicant,
        bytes32 indexed consensusId,
        ConsensusStatus indexed status,
        ActionType actionType
    );

    /**
     * @dev Consensus canceled event
     */
    event ConsensusCanceled(
        address indexed applicant,
        bytes32 indexed consensusId,
        ActionType indexed actionType
    );

    /**
     * @dev Action canceled event
     */
    event ActionCanceled(
        address indexed applicant,
        bytes32 indexed consensusId,
        ActionType indexed actionType
    );

    /**
     * @dev Action executed event
     */
    event ActionExecuted(
        address indexed sender,
        bytes32 indexed consensusId,
        ActionType indexed actionType,
        bytes data
    );

    function startConsensus(ConsensusRequest calldata request)
        external
        returns (bytes32 consensusId);

    function voteConsensus(bytes32 consensusId, bool vote) external;

    function cancelConsensus(bytes32 consensusId) external;

    function cancelAction(bytes32 consensusId) external;

    function runAction(
        bytes32 consensusId,
        uint256 optionalData1,
        uint256 optionalData2
    ) external returns (bytes memory);

    function getCurrentConsensus() external view returns (bytes32);

    function getConsensusStage() external view returns (ConsensusStage);

    function getConsensusTime() external view returns (uint256);

    function getConsensusData(bytes32 consensusId) external view returns (ConsensusData memory);

    function getConsensusStatus(bytes32 consensusId) external view returns (ConsensusStatus);
}
