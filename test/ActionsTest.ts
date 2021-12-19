/* eslint-disable node/no-missing-import */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
import { expect } from "chai";
import { ethers } from "ethers";
import { waffle } from "hardhat";
import * as base from "./Base";

import LivelyToken from "../artifacts/contracts/ERC20Token/ILivelyToken.sol/ILivelyToken.json";
import Management from "../artifacts/contracts/Management.sol/Management.json";

const { provider, deployMockContract, deployContract } = waffle;

describe("GRANT_ROLE Action", function () {
  let tokenManagement: ethers.Contract;
  let livelyTokenMock: ethers.Contract;
  let ctoWallet: ethers.Wallet;
  let ceoWallet: ethers.Wallet;
  let cooWallet: ethers.Wallet;
  let adminWallet: ethers.Wallet;
  let optionalAccount1: ethers.Wallet;
  let optionalAccount2: ethers.Wallet;
  let consensusId: string;

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

    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.GRANT_ROLE,
      optAccount1: optionalAccount1.address,
      optAccount2: optionalAccount2.address,
      role: base.ADMIN_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    await expect(tokenManagement.connect(ctoWallet).startConsensus(request))
      .to.emit(tokenManagement, "ConsensusStarted")
      .withArgs(
        ctoWallet.address,
        ethers.utils.keccak256(
          ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
        ),
        base.ActionType.GRANT_ROLE
      );

    consensusId = await tokenManagement.getCurrentConsensus();
    await tokenManagement.connect(ceoWallet).voteConsensus(consensusId, true);
    await tokenManagement.connect(cooWallet).voteConsensus(consensusId, true);
  });

  it("Should CTO actionRun for GRANT_ROLE ", async () => {
    // Given
    livelyTokenMock.mock.grantRole
      .withArgs(
        base.ADMIN_ROLE,
        optionalAccount1.address,
        optionalAccount2.address
      )
      .returns();

    // When
    await expect(
      tokenManagement.connect(ctoWallet).runAction(consensusId, 0, 0)
    )
      .to.emit(tokenManagement, "ActionExecuted")
      .withArgs(
        ctoWallet.address,
        consensusId,
        base.ActionType.GRANT_ROLE,
        base.ActionStatus.SUCCESS,
        "0x"
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.ACCEPTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.SUCCESS);

    // and
    expect(await tokenManagement.getConsensusStage()).to.equal(
      base.ConsensusStage.NONE_STAGE
    );
  });

  it("Should anyrole couldn't actionRun after it completed ", async () => {
    await expect(
      tokenManagement.connect(ctoWallet).runAction(consensusId, 0, 0)
    ).to.revertedWith("InvalidStageError()");
  });
});

describe("CHANGE_ROLE Action", function () {
  let tokenManagement: ethers.Contract;
  let livelyTokenMock: ethers.Contract;
  let ctoWallet: ethers.Wallet;
  let ceoWallet: ethers.Wallet;
  let cooWallet: ethers.Wallet;
  let adminWallet: ethers.Wallet;
  let optionalAccount1: ethers.Wallet;
  let optionalAccount2: ethers.Wallet;
  let consensusId: string;

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

    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.CHANGE_ROLE,
      optAccount1: cooWallet.address,
      optAccount2: optionalAccount1.address,
      role: base.COO_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    await expect(tokenManagement.connect(ctoWallet).startConsensus(request))
      .to.emit(tokenManagement, "ConsensusStarted")
      .withArgs(
        ctoWallet.address,
        ethers.utils.keccak256(
          ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
        ),
        base.ActionType.CHANGE_ROLE
      );

    consensusId = await tokenManagement.getCurrentConsensus();
    await tokenManagement.connect(ceoWallet).voteConsensus(consensusId, true);
    await tokenManagement.connect(cooWallet).voteConsensus(consensusId, true);
  });

  it("Should CTO actionRun for CHANGE_ROLE ", async () => {
    // When
    await expect(
      tokenManagement.connect(ctoWallet).runAction(consensusId, 0, 0)
    )
      .to.emit(tokenManagement, "ActionExecuted")
      .withArgs(
        ctoWallet.address,
        consensusId,
        base.ActionType.CHANGE_ROLE,
        base.ActionStatus.SUCCESS,
        "0x"
      );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.ACCEPTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.SUCCESS);

    // and
    expect(
      await tokenManagement.hasRole(base.COO_ROLE, optionalAccount1.address)
    ).to.equal(true);
  });
});

describe("Cancel Action ", function () {
  let tokenManagement: ethers.Contract;
  let livelyTokenMock: ethers.Contract;
  let ctoWallet: ethers.Wallet;
  let ceoWallet: ethers.Wallet;
  let cooWallet: ethers.Wallet;
  let adminWallet: ethers.Wallet;
  let optionalAccount1: ethers.Wallet;
  let optionalAccount2: ethers.Wallet;
  let consensusId: string;

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

    const request: base.ConsensusRequest = {
      id: 1,
      actionType: base.ActionType.CHANGE_ROLE,
      optAccount1: cooWallet.address,
      optAccount2: optionalAccount1.address,
      role: base.COO_ROLE,
      amount: ethers.BigNumber.from(0),
    };

    await expect(tokenManagement.connect(ctoWallet).startConsensus(request))
      .to.emit(tokenManagement, "ConsensusStarted")
      .withArgs(
        ctoWallet.address,
        ethers.utils.keccak256(
          ethers.utils.hexlify([0x00, 0x00, 0x00, request.id])
        ),
        base.ActionType.CHANGE_ROLE
      );

    consensusId = await tokenManagement.getCurrentConsensus();
    await tokenManagement.connect(ceoWallet).voteConsensus(consensusId, true);
    await tokenManagement.connect(cooWallet).voteConsensus(consensusId, true);
  });

  it("Should anyone else applicant couldn't cancel action", async () => {
    // When
    await expect(
      tokenManagement.connect(cooWallet).cancelAction(consensusId)
    ).to.revertedWith(
      'ForbiddenError("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")'
    );

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.ACCEPTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.PENDING);
  });
  it("Should applicant could cancel action", async () => {
    // given
    const consensusId = await tokenManagement.getCurrentConsensus();

    // when
    await expect(tokenManagement.connect(ctoWallet).cancelAction(consensusId))
      .to.be.emit(tokenManagement, "ActionCanceled")
      .withArgs(ctoWallet.address, consensusId, base.ActionType.CHANGE_ROLE);

    // then
    const consensusData = await tokenManagement.getConsensusData(consensusId);
    expect(consensusData.status).to.equal(base.ConsensusStatus.ACCEPTED);
    expect(consensusData.actionStatus).to.equal(base.ActionStatus.CANCELED);
  });
});
