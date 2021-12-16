import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20 Token Test", function () {
  it("Should deployment totalSupply equal to initial token value", async () => {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(10000);
    await token.deployed();

    expect(await token.totalSupply()).to.equal(10000);
  });

  it("Should deployment assign the total supply of tokens to the owner", async () => {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(10000);
    await token.deployed();

    const ownerBalance = await token.balanceOf(owner.address);
    expect(await token.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async () => {
    // eslint-disable-next-line no-unused-vars
    const [_owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(10000);
    await token.deployed();

    await token.transfer(addr1.address, 50);
    expect(await token.balanceOf(addr1.address)).to.equal(50);

    await token.connect(addr1).transfer(addr2.address, 50);
    expect(await token.balanceOf(addr2.address)).to.equal(50);
  });
});
