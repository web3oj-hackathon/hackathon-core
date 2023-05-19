import { task } from "hardhat/config";

task("deploy-erc20", "Deploy ERC20 contract")
  .addParam("name")
  .addParam("symbol")
  .setAction(async (args, hre) => {
    const { name, symbol } = args;

    const DevERC20 = await hre.ethers.getContractFactory("DevERC20");
    const devERC20 = await DevERC20.deploy(name, symbol);
    await devERC20.deployed();

    console.log(`${name}(${symbol}) token deployed to:`, devERC20.address);
  });

task("mint", "Mint ERC20 tokens")
  .addParam("contract")
  .addParam("amount")
  .setAction(async (args, hre) => {
    const { contract, amount } = args;

    const DevERC20 = await hre.ethers.getContractFactory("DevERC20");
    const devERC20 = await DevERC20.attach(contract);

    const account = await hre.ethers.provider.getSigner().getAddress();

    const tx = await devERC20.mint(account, hre.ethers.utils.parseEther(amount));
    await tx.wait();

    console.log(`${amount} tokens minted to:`, account);
  });
