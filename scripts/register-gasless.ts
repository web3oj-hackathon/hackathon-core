import { ethers } from "hardhat";

require("dotenv").config();

const DOMAIN_NAME = "GaslessERC20";
const DOMAIN_VERSION = "1";
const REQUEST_TYPE = "GaslessERC20TxRequest";
const REQUEST_TYPE_SUFFIX = "bytes8 typeSuffixDatadatadatada)";

async function main() {
  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.attach(process.env.HACKATHON_FORWARDER_ADDRESS || "");

  // register domain separator for gasless ERC20 transactions.
  const domainRegisterTx = await forwarder.registerDomainSeparator(DOMAIN_NAME, DOMAIN_VERSION);
  await domainRegisterTx.wait();

  // register request type for gasless ERC20 transactions.
  const requestTypeRegisterTx = await forwarder.registerRequestType(REQUEST_TYPE, REQUEST_TYPE_SUFFIX);
  await requestTypeRegisterTx.wait();

  console.log("domain separator and type registered");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
