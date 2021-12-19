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

describe("Consensus Quorum Max Accepetd With Vote", function () {
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

  it("Should CTO role start consensus for FREEZE", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.FREEZE,
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
        base.ActionType.FREEZE
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
        base.ActionType.FREEZE
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

describe("Consensus Quorum Max Accepetd With Time", function () {
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
      1,
    ]);
  });

  it("Should CTO role start consensus for UNFREEZE", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.UNFREEZE,
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
        base.ActionType.UNFREEZE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should specific consensus accepted with positive vote after expiration time", async () => {
    // givenbase.OTHER_VOTE_PERECNT
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(cooWallet).voteConsensus(consensusId, false)
    )
      .to.emit(tokenManagement, "ConsensusFinished")
      .withArgs(
        ctoWallet.address,
        consensusId,
        base.ConsensusStatus.ACCEPTED,
        base.ActionType.UNFREEZE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.ACCEPTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.PENDING);
    expect(consensusData.votePercent).to.equal(
      base.OTHER_VOTE_PERECNT - base.OTHER_VOTE_PERECNT
    );

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.ACTION_STAGE
    );
  });
});

describe("Consensus Quorum Max REJECTED With Vote", function () {
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

  it("Should CTO role start consensus for PAUSE", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.PAUSE,
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
        base.ActionType.PAUSE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should CEO role negiative vote to specific consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await tokenManagement.connect(ceoWallet).voteConsensus(consensusId, false);

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.VOTING);
    expect(consensusData.votePercent).to.equal(
      base.OTHER_VOTE_PERECNT - base.CEO_VOTE_PERECNT
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
        ctoWallet.address,
        consensusId,
        base.ConsensusStatus.REJECTED,
        base.ActionType.PAUSE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.REJECTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(
      base.OTHER_VOTE_PERECNT - base.CEO_VOTE_PERECNT - base.OTHER_VOTE_PERECNT
    );

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.NONE_STAGE
    );
  });
});

describe("Consensus Quorum Max REJECTED With Vote", function () {
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

  it("Should CTO role start consensus for UNPAUSE", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.UNPAUSE,
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
        base.ActionType.UNPAUSE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should specific consensus rejected with CEO negative vote after expiration time", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(ceoWallet).voteConsensus(consensusId, false)
    )
      .to.emit(tokenManagement, "ConsensusFinished")
      .withArgs(
        ctoWallet.address,
        consensusId,
        base.ConsensusStatus.REJECTED,
        base.ActionType.UNPAUSE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.REJECTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(
      base.OTHER_VOTE_PERECNT - base.CEO_VOTE_PERECNT
    );

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.NONE_STAGE
    );
  });
});
