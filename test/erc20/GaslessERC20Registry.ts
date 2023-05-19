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

  it("should proxy gasless registry", async () => {
    const { gaslessRegistry, gaslessAVAX } = await loadFixture(deployGaslessRegistryFixture);

    // cannt proxy gasless ether contract again.
    expect(gaslessRegistry.proxyGaslessAVAX(gaslessAVAX.address)).to.be.reverted;
  });

  it("should register ERC20", async () => {
    const { gaslessRegistry } = await loadFixture(deployGaslessRegistryFixture);
    const { testERC20 } = await loadFixture(deployTestERC20Fixture);

    // register Test ERC20 tokens to gasless registry.
    await gaslessRegistry.createGaslessERC20(testERC20.address);
    // cannot register again.
    expect(gaslessRegistry.createGaslessERC20(testERC20.address)).to.be.reverted;
    // check if the token is registered, so gasless token address should not be zero.
    expect(await gaslessRegistry.gaslessTokens(testERC20.address)).to.be.not.equal(ethers.constants.AddressZero);
  });

  it("should have gasless name and symbol prefix", async () => {
    const { gaslessERC20 } = await loadFixture(deployGaslessRegistryWithERC20Fixture);

    // the name of gasless ERC20 should be prefixed with "Gasless "
    expect(await gaslessERC20.name()).to.be.equal("Gasless TestERC20");
    // the symbol of gasless ERC20 should be prefixed with "g"
    expect(await gaslessERC20.symbol()).to.be.equal("gTEST");
  });
});
