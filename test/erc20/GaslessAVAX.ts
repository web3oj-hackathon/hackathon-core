import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Signer } from "ethers";
import { ethers } from "hardhat";

describe("GaslessAVAXRegistry", () => {
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

    const GaslessAVAX = await ethers.getContractFactory("GaslessAVAX");
    const gaslessAVAX = await GaslessAVAX.connect(gaslessRegistryOwner).deploy(gaslessRegistry.address);
    await gaslessAVAX.deployed();

    return { gaslessRegistry, forwarder, gaslessAVAX };
  }

  async function deployGaslessRegistryWithERC20Fixture() {
    const { gaslessRegistry, forwarder, gaslessAVAX } = await deployGaslessRegistryFixture();
    const { testERC20 } = await deployTestERC20Fixture();

    await gaslessRegistry.proxyGaslessAVAX(gaslessAVAX.address);
    await gaslessRegistry.createGaslessERC20(testERC20.address);

    // get gasless ERC20 contract
    const GaslessERC20 = await ethers.getContractFactory("GaslessERC20");
    const gaslessERC20 = await GaslessERC20.connect(gaslessRegistryOwner).attach(
      await gaslessRegistry.gaslessTokens(testERC20.address)
    );

    return { gaslessRegistry, forwarder, testERC20, gaslessAVAX, gaslessERC20 };
  }

  it("should deposit AVAX", async () => {
    const { gaslessAVAX } = await loadFixture(deployGaslessRegistryWithERC20Fixture);

    // deposit 1000 Test ERC20 tokens to gasless registry.
    await gaslessAVAX.connect(account1).deposit({ value: 1000 });

    // gasless ERC20 contract should have 1000 Test ERC20 tokens.
    expect(await ethers.provider.getBalance(await gaslessAVAX.address)).to.equal(1000);

    // account1 should have 1000 pegged gasless ERC20 tokens.
    expect(await gaslessAVAX.balanceOf(await account1.getAddress())).to.equal(1000);
  });

  it("should withdraw AVAX", async () => {
    const { gaslessAVAX } = await loadFixture(deployGaslessRegistryWithERC20Fixture);

    // deposit 1000 Test ERC20 tokens to gasless registry.
    await gaslessAVAX.connect(account1).deposit({ value: 1000 });

    // withdraw 1000 Test ERC20 tokens from gasless registry.
    await gaslessAVAX.connect(account1).withdraw(account1.getAddress(), 1000);

    // gasless ERC20 contract should have 0 Test ERC20 tokens.
    expect(await ethers.provider.getBalance(await gaslessAVAX.address)).to.equal(0);

    // account1 should have 0 pegged gasless ERC20 tokens.
    expect(await gaslessAVAX.balanceOf(await account1.getAddress())).to.equal(0);
  });
});
