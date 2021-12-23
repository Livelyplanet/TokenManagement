/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
import { ethers } from "ethers";

export const CTO_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("CTO_ROLE")
);
export const CEO_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("CEO_ROLE")
);
export const COO_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("COO_ROLE")
);
export const ADMIN_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("ADMIN_ROLE")
);
export const BURNABLE_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("BURNABLE_ROLE")
);

export const CEO_VOTE_PERECNT = 36;
export const OTHER_VOTE_PERECNT = 32;

export enum ActionType {
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
  WITHDRAWAL_BALANCE, // Lively ERC20 Token, gt 60% vote percent
}

export enum ConsensusStage {
  NONE_STAGE,
  VOTE_STAGE,
  ACTION_STAGE,
}

export enum ActionStatus {
  SUCCESS,
  PENDING,
  CANCELED,
  NONE,
}

export enum ConsensusStatus {
  ACCEPTED,
  REJECTED,
  CANCELED,
  VOTING,
}

export interface ConsensusData {
  requestId: number;
  actionType: ActionType;
  actionStatus: ActionStatus;
  status: ConsensusStatus;
  votePercent: number;
  applicant: ethers.Wallet;
  optAccount1?: string;
  optAccount2?: string;
  role?: string;
  amount?: ethers.BigNumber;
}

export interface ConsensusRequest {
  id: number;
  actionType: ActionType;
  optAccount1: string;
  optAccount2: string;
  role: string;
  amount: ethers.BigNumber;
}
