/* eslint-disable node/no-missing-import */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
import { expect } from "chai";
import { ethers } from "ethers";
import { waffle } from "hardhat";
import * as base from "../Base";

import LivelyToken from "../../artifacts/contracts/ERC20Token/ILivelyToken.sol/ILivelyToken.json";
import Management from "../../artifacts/contracts/Management.sol/Management.json";

const { provider, deployMockContract, deployContract } = waffle;

describe("Consensus Quorum GT 60 Accepetd", function () {
  let tokenManagement: ethers.Contract;
  let livelyTokenMock: ethers.Contract;
  let ctoWallet: ethers.Wallet;
  let ceoWallet: ethers.Wallet;
  let cooWallet: ethers.Wallet;
  let adminWallet: ethers.Wallet;
  let optionalAccount1: ethers.Wallet;
  let optionalAccount2: ethers.Wallet;

  before(async () => {
    [
      ctoWallet,
      ceoWallet,
      cooWallet,
      adminWallet,
      optionalAccount1,
      optionalAccount2,
    ] = provider.getWallets();

    livelyTokenMock = await deployMockContract(adminWallet, LivelyToken.abi);
    // console.log(`lively address: ${livelyTokenMock.address}`);

    // IAccessControl
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xba7df352")
      .returns(true);
    // IBurnable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xde7bf0a2")
      .returns(true);
    // IMintable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xa647e8ec")
      .returns(true);
    // IFreezable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x991ebb18")
      .returns(true);
    // IERC20
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x942e8b22")
      .returns(true);
    // IERC20Sec
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xb85502e8")
      .returns(true);
    // IERC165
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x01ffc9a7")
      .returns(true);
    // IPausable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xe613f82a")
      .returns(true);

    tokenManagement = await deployContract(ctoWallet, Management, [
      livelyTokenMock.address,
      ctoWallet.address,
      ceoWallet.address,
      cooWallet.address,
      0,
    ]);
  });

  it("Should CTO role start consensus for APPROVE", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.APPROVE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: "0x" + "0".repeat(64),
      amount: ethers.BigNumber.from(0),
    };

    // when
    await expect(tokenManagement.connect(ctoWallet).startConsensus(request))
      .to.emit(tokenManagement, "ConsensusStarted")
      .withArgs(
        ctoWallet.address,
        ethers.utils.keccak256(
          ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
        ),
        base.ActionType.APPROVE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should COO role positive vote to specific consensus and it accepted", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(cooWallet).voteConsensus(consensusId, true)
    )
      .to.emit(tokenManagement, "ConsensusFinished")
      .withArgs(
        ctoWallet.address,
        consensusId,
        base.ConsensusStatus.ACCEPTED,
        base.ActionType.APPROVE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.ACCEPTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.PENDING);
    expect(consensusData.votePercent).to.equal(
      base.OTHER_VOTE_PERECNT + base.OTHER_VOTE_PERECNT
    );

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.ACTION_STAGE
    );
  });
});

describe("Consensus Quorum GT 60 Rejected With Vote", function () {
  let tokenManagement: ethers.Contract;
  let livelyTokenMock: ethers.Contract;
  let ctoWallet: ethers.Wallet;
  let ceoWallet: ethers.Wallet;
  let cooWallet: ethers.Wallet;
  let adminWallet: ethers.Wallet;
  let optionalAccount1: ethers.Wallet;
  let optionalAccount2: ethers.Wallet;

  before(async () => {
    [
      ctoWallet,
      ceoWallet,
      cooWallet,
      adminWallet,
      optionalAccount1,
      optionalAccount2,
    ] = provider.getWallets();

    livelyTokenMock = await deployMockContract(adminWallet, LivelyToken.abi);

    // IAccessControl
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xba7df352")
      .returns(true);
    // IBurnable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xde7bf0a2")
      .returns(true);
    // IMintable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xa647e8ec")
      .returns(true);
    // IFreezable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x991ebb18")
      .returns(true);
    // IERC20
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x942e8b22")
      .returns(true);
    // IERC20Sec
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xb85502e8")
      .returns(true);
    // IERC165
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x01ffc9a7")
      .returns(true);
    // IPausable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xe613f82a")
      .returns(true);

    tokenManagement = await deployContract(ctoWallet, Management, [
      livelyTokenMock.address,
      ctoWallet.address,
      ceoWallet.address,
      cooWallet.address,
      0,
    ]);
  });

  it("Should CEO role start consensus for WITHDRAWAL_BALANCE ", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.WITHDRAWAL_BALANCE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: "0x" + "0".repeat(64),
      amount: ethers.BigNumber.from(0),
    };

    // when
    await expect(tokenManagement.connect(ceoWallet).startConsensus(request))
      .to.emit(tokenManagement, "ConsensusStarted")
      .withArgs(
        ceoWallet.address,
        ethers.utils.keccak256(
          ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
        ),
        base.ActionType.WITHDRAWAL_BALANCE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should CTO role negative vote to specific consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await tokenManagement.connect(ctoWallet).voteConsensus(consensusId, false);

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.VOTING);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(
      base.CEO_VOTE_PERECNT - base.OTHER_VOTE_PERECNT
    );

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.VOTE_STAGE
    );
  });

  it("Should COO role negative vote to specific consensus and it rejected", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(cooWallet).voteConsensus(consensusId, false)
    )
      .to.emit(tokenManagement, "ConsensusFinished")
      .withArgs(
        ceoWallet.address,
        consensusId,
        base.ConsensusStatus.REJECTED,
        base.ActionType.WITHDRAWAL_BALANCE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.REJECTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(
      base.CEO_VOTE_PERECNT - base.OTHER_VOTE_PERECNT - base.OTHER_VOTE_PERECNT
    );

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.NONE_STAGE
    );
  });
});

describe("Consensus Quorum GT 60 Rejected With Time", function () {
  let tokenManagement: ethers.Contract;
  let livelyTokenMock: ethers.Contract;
  let ctoWallet: ethers.Wallet;
  let ceoWallet: ethers.Wallet;
  let cooWallet: ethers.Wallet;
  let adminWallet: ethers.Wallet;
  let optionalAccount1: ethers.Wallet;
  let optionalAccount2: ethers.Wallet;

  before(async () => {
    [
      ctoWallet,
      ceoWallet,
      cooWallet,
      adminWallet,
      optionalAccount1,
      optionalAccount2,
    ] = provider.getWallets();

    livelyTokenMock = await deployMockContract(adminWallet, LivelyToken.abi);

    // IAccessControl
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xba7df352")
      .returns(true);
    // IBurnable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xde7bf0a2")
      .returns(true);
    // IMintable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xa647e8ec")
      .returns(true);
    // IFreezable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x991ebb18")
      .returns(true);
    // IERC20
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x942e8b22")
      .returns(true);
    // IERC20Sec
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xb85502e8")
      .returns(true);
    // IERC165
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0x01ffc9a7")
      .returns(true);
    // IPausable
    await livelyTokenMock.mock.supportsInterface
      .withArgs("0xe613f82a")
      .returns(true);

    tokenManagement = await deployContract(ctoWallet, Management, [
      livelyTokenMock.address,
      ctoWallet.address,
      ceoWallet.address,
      cooWallet.address,
      1,
    ]);
  });

  it("Should COO role start consensus for WITHDRAWAL_BALANCE ", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.WITHDRAWAL_BALANCE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: "0x" + "0".repeat(64),
      amount: ethers.BigNumber.from(0),
    };

    // when
    await expect(tokenManagement.connect(cooWallet).startConsensus(request))
      .to.emit(tokenManagement, "ConsensusStarted")
      .withArgs(
        cooWallet.address,
        ethers.utils.keccak256(
          ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
        ),
        base.ActionType.WITHDRAWAL_BALANCE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should anyrole couldn't vote to completed consensus time", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(ctoWallet).voteConsensus(consensusId, false)
    )
      .to.be.emit(tokenManagement, "ConsensusFinished")
      .withArgs(
        cooWallet.address,
        consensusId,
        base.ConsensusStatus.REJECTED,
        base.ActionType.WITHDRAWAL_BALANCE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.REJECTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(
      base.OTHER_VOTE_PERECNT - base.OTHER_VOTE_PERECNT
    );

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.NONE_STAGE
    );
  });
});
