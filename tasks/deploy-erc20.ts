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
  .addOptionalParam("target")
  .addParam("amount")
  .setAction(async (args, hre) => {
    const { contract, target, amount } = args;

    const DevERC20 = await hre.ethers.getContractFactory("DevERC20");
    const devERC20 = await DevERC20.attach(contract);

    const account = target ?? (await hre.ethers.provider.getSigner().getAddress());

    const tx = await devERC20.mint(account, hre.ethers.utils.parseEther(amount));
    await tx.wait();

    console.log(`${amount} tokens minted to:`, account);
  });

task("deposit", "Deposit ERC20 tokens")
  .addParam("contract")
  .addParam("amount")
  .setAction(async (args, hre) => {
    const { contract, amount } = args;

    const DevERC20 = await hre.ethers.getContractFactory("DevERC20");
    const devERC20 = await DevERC20.attach(contract);

    const GaslessERC20Registry = await hre.ethers.getContractFactory("GaslessERC20Registry");
    const gaslessERC20Registry = await GaslessERC20Registry.attach(process.env.HACKATHON_REGISTRY_ADDRESS || "");

    const gaslessERC20Address = await gaslessERC20Registry.gaslessTokens(contract);

    console.log("GaslessERC20 address:", gaslessERC20Address);

    const GaslessERC20 = await hre.ethers.getContractFactory("GaslessERC20");
    const gaslessERC20 = await GaslessERC20.attach(gaslessERC20Address);

    const approveTx = await devERC20.approve(gaslessERC20.address, hre.ethers.utils.parseEther(amount));
    await approveTx.wait();

    const tx = await gaslessERC20.deposit(hre.ethers.utils.parseEther(amount));
    await tx.wait();

    console.log(`${amount} tokens deposited to:`, devERC20.address);
  });
