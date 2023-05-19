import { ethers } from "hardhat";

require("dotenv").config();

async function main() {
  // deploy WAVAX10 (same as WETH10) contract.
  const WAVAX10 = await ethers.getContractFactory("WAVAX10");
  const wavax10 = await WAVAX10.deploy();
  await wavax10.deployed();

  console.log("WAVAX10 deployed to:", wavax10.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
