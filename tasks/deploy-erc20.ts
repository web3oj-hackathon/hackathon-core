import { task } from "hardhat/config";

task("deploy-erc20", "Deploy ERC20 contract")
  .addParam("name")
  .addParam("symbol")
  .setAction(async (args, hre) => {
    const { name, symbol } = args;

    const DevERC20 = await ethers.getContractFactory("DevERC20");
    const devERC20 = await DevERC20.deploy(name, symbol);
    await devERC20.deployed();

    console.log(`${name}(${symbol}) token deployed to:`, devERC20.address);
  });
