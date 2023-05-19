import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Signer } from "ethers";
import { ethers } from "hardhat";

describe("GaslessERC20Registry", () => {
  let forwarderOwner: Signer;
  let gaslessRegistryOwner: Signer;
  let account1: Signer;
  let account2: Signer;

  before(async () => {
    [forwarderOwner, gaslessRegistryOwner, account1, account2] = await ethers.getSigners();
  });

  async function deployTestERC20Fixture() {
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const testERC20 = await TestERC20.connect(gaslessRegistryOwner).deploy();
    await testERC20.deployed();

    return { testERC20 };
  }

  async function deployGaslessRegistryFixture() {
    const Forwarder = await ethers.getContractFactory("Forwarder");
    const forwarder = await Forwarder.connect(forwarderOwner).deploy();
    await forwarder.deployed();

    const GaslessRegistry = await ethers.getContractFactory("GaslessERC20Registry");
    const gaslessRegistry = await GaslessRegistry.connect(gaslessRegistryOwner).deploy(forwarder.address);
    await gaslessRegistry.deployed();

    const GaslessETH = await ethers.getContractFactory("GaslessETH");
    const gaslessETH = await GaslessETH.connect(gaslessRegistryOwner).deploy(gaslessRegistry.address);
    await gaslessETH.deployed();

    return { gaslessRegistry, forwarder, gaslessETH };
  }

  async function deployGaslessRegistryWithERC20Fixture() {
    const { gaslessRegistry, forwarder, gaslessETH } = await deployGaslessRegistryFixture();
    const { testERC20 } = await deployTestERC20Fixture();

    await gaslessRegistry.proxyGaslessETH(gaslessETH.address);
    await gaslessRegistry.createGaslessERC20(testERC20.address);

    // get gasless ERC20 contract
    const GaslessERC20 = await ethers.getContractFactory("GaslessERC20");
    const gaslessERC20 = await GaslessERC20.connect(gaslessRegistryOwner).attach(
      await gaslessRegistry.gaslessTokens(testERC20.address)
    );

    return { gaslessRegistry, forwarder, testERC20, gaslessETH, gaslessERC20 };
  }

  it("should deposit ERC20", async () => {
    const { testERC20, gaslessERC20 } = await loadFixture(deployGaslessRegistryWithERC20Fixture);

    // mint 1000 * 10^18 Test ERC20 tokens to account1 for testing.
    testERC20.mint(await account1.getAddress(), ethers.utils.parseUnits("1000", "ether"));

    // approve ERC20 tokens to gasless ERC20 contract.
    await testERC20.connect(account1).approve(gaslessERC20.address, 1000);

    // deposit 1000 Test ERC20 tokens to gasless registry.
    await gaslessERC20.connect(account1).deposit(1000);

    // gasless ERC20 contract should have 1000 Test ERC20 tokens.
    expect(await testERC20.balanceOf(await gaslessERC20.address)).to.equal(1000);

    // account1 should have 1000 pegged gasless ERC20 tokens.
    expect(await gaslessERC20.balanceOf(await account1.getAddress())).to.equal(1000);
  });

  it("should withdraw ERC20", async () => {
    const { testERC20, gaslessERC20 } = await loadFixture(deployGaslessRegistryWithERC20Fixture);

    // mint 1000 * 10^18 Test ERC20 tokens to account1 for testing.
    testERC20.mint(await account1.getAddress(), ethers.utils.parseUnits("1000", "ether"));

    // approve ERC20 tokens to gasless ERC20 contract.
    await testERC20.connect(account1).approve(gaslessERC20.address, 1000);

    // deposit 1000 Test ERC20 tokens to gasless registry.
    await gaslessERC20.connect(account1).deposit(1000);

    // withdraw 1000 Test ERC20 tokens from gasless registry.
    await gaslessERC20.connect(account1).withdraw(account1.getAddress(), 1000);

    // gasless ERC20 contract should have 0 Test ERC20 tokens.
    expect(await testERC20.balanceOf(await gaslessERC20.address)).to.equal(0);

    // account1 should have 0 pegged gasless ERC20 tokens.
    expect(await gaslessERC20.balanceOf(await account1.getAddress())).to.equal(0);
  });
});
