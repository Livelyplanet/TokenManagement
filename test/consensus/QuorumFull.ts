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

describe("Consensus Quorum Full Accepetd", function () {
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

  it("Should deplyment of token management", async () => {
    expect(await tokenManagement.hasRole(base.CTO_ROLE, ctoWallet.address)).to
      .be.true;
    expect(await tokenManagement.hasRole(base.CEO_ROLE, ceoWallet.address)).to
      .be.true;
    expect(await tokenManagement.hasRole(base.COO_ROLE, cooWallet.address)).to
      .be.true;

    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.NONE_STAGE
    );
  });

  it("Should anyone couldn't start consensus", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.GRANT_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.ADMIN_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    // when
    await expect(
      tokenManagement.connect(optionalAccount1).startConsensus(request)
    ).to.be.revertedWith(
      'UnauthorizedError("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")'
    );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
  });

  it("Should couldn't start consensus with zero request id ", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 0,
      actionType: base.ActionType.GRANT_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.ADMIN_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    // when
    await expect(
      tokenManagement.connect(ctoWallet).startConsensus(request)
    ).to.be.revertedWith("IllegalRequestError()");
  });

  it("Should CTO role start consensus for GRANT_ROLE ", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.GRANT_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.ADMIN_ROLE,
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
        base.ActionType.GRANT_ROLE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should get consensus data after create it", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();
    let consensusData: base.ConsensusData;

    // when
    // eslint-disable-next-line prefer-const
    consensusData = await tokenManagement.getConsensusData(consensusId);

    // then
    expect(consensusData.requestId).to.equal(1);
    expect(consensusData.actionType).to.equal(base.ActionType.GRANT_ROLE);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.status).to.equal(base.ConsensusStatus.VOTING);
    expect(consensusData.votePercent).to.equal(base.OTHER_VOTE_PERECNT);
    expect(consensusData.role).to.equal(base.ADMIN_ROLE);
    expect(consensusData.optAccount1).to.equal(optionalAccount1.address);
    expect(consensusData.optAccount2).to.equal(optionalAccount2.address);
    expect(consensusData.amount).to.equal(ethers.BigNumber.from(0));

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.VOTE_STAGE
    );
  });

  it("Should get consensus status after create it", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    const status: base.ConsensusStatus =
      await tokenManagement.getConsensusStatus(consensusId);

    // then
    expect(status).to.equal(base.ConsensusStatus.VOTING);
  });

  it("Should anyone couldn't start consensus when voting state", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.REVOKE_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.ADMIN_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    // when
    await expect(
      tokenManagement.connect(ceoWallet).startConsensus(request)
    ).to.be.revertedWith("InvalidStageError()");
  });

  it("Should CEO role positive vote to specific consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await tokenManagement.connect(ceoWallet).voteConsensus(consensusId, true);

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.VOTING);
    expect(consensusData.votePercent).to.equal(
      base.CEO_VOTE_PERECNT + base.OTHER_VOTE_PERECNT
    );
  });

  it("Should CTO role couldn't duplicate votes to specific consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(ctoWallet).voteConsensus(consensusId, true)
    ).to.be.revertedWith("IllegalVoteError()");

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.VOTING);
    expect(consensusData.votePercent).to.equal(
      base.CEO_VOTE_PERECNT + base.OTHER_VOTE_PERECNT
    );
  });

  it("Should anyone couldn't vote to specific consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(optionalAccount1).voteConsensus(consensusId, true)
    ).to.be.revertedWith(
      'UnauthorizedError("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")'
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
        base.ActionType.GRANT_ROLE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.ACCEPTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.PENDING);
    expect(consensusData.votePercent).to.equal(
      base.CEO_VOTE_PERECNT + base.OTHER_VOTE_PERECNT + base.OTHER_VOTE_PERECNT
    );
  });
});

describe("Consensus Quorum Full Rejected With Vote", function () {
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

  it("Should CEO role could start consensus for REVOKE_ROLE", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.REVOKE_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.BURNABLE_ROLE,
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
        base.ActionType.REVOKE_ROLE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should CTO negative vote to specific consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(ctoWallet).voteConsensus(consensusId, false)
    )
      .to.be.emit(tokenManagement, "ConsensusFinished")
      .withArgs(
        ceoWallet.address,
        consensusId,
        base.ConsensusStatus.REJECTED,
        base.ActionType.REVOKE_ROLE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.REJECTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(
      base.CEO_VOTE_PERECNT - base.OTHER_VOTE_PERECNT
    );
  });

  it("Should COO role couldn't vote to rejected consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when and then
    await expect(
      tokenManagement.connect(cooWallet).voteConsensus(consensusId, true)
    ).to.be.revertedWith("InvalidStageError()");
  });

  it("Should anyrole couldn't start consensus with duplicate requestId", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.REVOKE_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.BURNABLE_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    // when and then
    await expect(
      tokenManagement.connect(ctoWallet).startConsensus(request)
    ).to.revertedWith("DuplicateRequestIdError()");
  });

  it("Should CTO role couldn't start consensus with invalid role", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 2,
      actionType: base.ActionType.CHANGE_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.ADMIN_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    // when
    await expect(
      tokenManagement.connect(ctoWallet).startConsensus(request)
    ).to.revertedWith("IllegalRoleError()");
  });

  it("Should anyrole could start next consensus after completed consensus", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 2,
      actionType: base.ActionType.GRANT_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.ADMIN_ROLE,
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
        base.ActionType.GRANT_ROLE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });

  it("Should anyone else applicant couldn't cancel consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(cooWallet).cancelConsensus(consensusId)
    ).to.revertedWith(
      'ForbiddenError("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")'
    );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.VOTING);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(base.OTHER_VOTE_PERECNT);
  });

  it("Should applicant could cancel consensus", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(
      tokenManagement.connect(ctoWallet).cancelConsensus(consensusId)
    )
      .to.be.emit(tokenManagement, "ConsensusCanceled")
      .withArgs(ctoWallet.address, consensusId, base.ActionType.GRANT_ROLE);

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.CANCELED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(base.OTHER_VOTE_PERECNT);
  });
  it("Should anyrole could start consensus after canceled consensus", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 10,
      actionType: base.ActionType.REVOKE_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.BURNABLE_ROLE,
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
        base.ActionType.REVOKE_ROLE
      );

    // then
    expect(await tokenManagement.getCurrentConsensus()).to.equal(
      ethers.utils.keccak256(
        ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
      )
    );
  });
});

describe("Consensus Quorum Full Rejected With Time", function () {
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

  it("Should COO role could start consensus for CHANGE_ROLE", async () => {
    // given
    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.CHANGE_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.COO_ROLE,
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
        base.ActionType.CHANGE_ROLE
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
        base.ActionType.CHANGE_ROLE
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.REJECTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.NONE);
    expect(consensusData.votePercent).to.equal(
      base.OTHER_VOTE_PERECNT - base.OTHER_VOTE_PERECNT
    );
  });
});
