import { ethers } from "hardhat";

require("dotenv").config();

async function main() {
  // get forwarder contract.
  // forwarder contract should be already deployed to the hackathon network.
  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.attach(process.env.HACKATHON_FORWARDER_ADDRESS as string);

  // deploy gasless registry contract.
  const GaslessRegistry = await ethers.getContractFactory("GaslessERC20Registry");
  const gaslessRegistry = await GaslessRegistry.deploy(forwarder.address);
  await gaslessRegistry.deployed();

  console.log("GaslessERC20Registry deployed to:", gaslessRegistry.address);

  // deploy gasless ether contract.
  const GaslessAVAX = await ethers.getContractFactory("GaslessAVAX");
  const gaslessAVAX = await GaslessAVAX.deploy(gaslessRegistry.address);
  await gaslessAVAX.deployed();

  console.log("gaslessAVAX deployed to:", gaslessAVAX.address);

  // proxy gasless ether contract.
  await gaslessRegistry.proxyGaslessAVAX(gaslessAVAX.address);
  console.log("gaslessAVAX proxied to:", gaslessAVAX.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
