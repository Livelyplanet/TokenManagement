// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

const livelyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Retrieve accounts from the local node
  const accounts = await ethers.provider.listAccounts();

  // We get the contract to deploy
  const Management = await ethers.getContractFactory("Management");
  const management = await Management.deploy(
    livelyAddress,
    accounts[0],
    accounts[1],
    accounts[2],
    0
  );

  await management.deployed();

  console.log("Management deployed to: ", management.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
