import { task } from "hardhat/config";

task("register", "Register ERC20 contract to GaslessERC20Registry")
  .addParam("registry")
  .addParam("contract")
  .setAction(async (args, hre) => {
    const { registry, contract } = args;

    const GaslessERC20Registry = await hre.ethers.getContractFactory("GaslessERC20Registry");
    const gaslessERC20Registry = await GaslessERC20Registry.attach(registry);

    const tx = await gaslessERC20Registry.createGaslessERC20(contract);
    await tx.wait();

    console.log(`${contract} registered to:`, await gaslessERC20Registry.gaslessTokens(contract));
  });
