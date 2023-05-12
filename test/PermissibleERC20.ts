import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";

function getPermitERC712data(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string,
  owner: string,
  spender: string,
  value: BigNumber,
  nonce: BigNumber,
  deadline: BigNumber
) {
  const Permit = [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ];

  const data = {
    primaryType: "Permit",
    types: { Permit: Permit },
    domain: {
      name: name,
      version: version,
      chainId: chainId,
      verifyingContract: verifyingContract,
    },
    message: { owner, spender, value, nonce, deadline },
  };

  return data;
}

describe("PermissibleERC20", function () {
  async function deployPermissibleERC20Fixture() {
    const [owner, account1, account2] = await ethers.getSigners();

    const PermissibleERC20 = await ethers.getContractFactory(
      "PermissibleERC20"
    );
    const permissibleERC20 = await PermissibleERC20.deploy("Test Token", "TST");
    await permissibleERC20.deployed();

    return { permissibleERC20, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set the right name, symbol", async function () {
      const { permissibleERC20 } = await loadFixture(
        deployPermissibleERC20Fixture
      );

      expect(await permissibleERC20.name()).to.equal("Test Token");
      expect(await permissibleERC20.symbol()).to.equal("TST");
    });
  });

  describe("Permit", function () {
    it("Should mint", async function () {
      const { permissibleERC20, owner } = await loadFixture(
        deployPermissibleERC20Fixture
      );

      await permissibleERC20.mint(owner.address, 100);
      expect(await permissibleERC20.balanceOf(owner.address)).to.equal(100);
    });

    // The owner minted 100 tokens to account1,
    // then account1 signed to transfer the tokens to account2.
    // Account2's permit followed the signature.
    it("Should permit", async function () {
      const { permissibleERC20, owner, account1, account2 } = await loadFixture(
        deployPermissibleERC20Fixture
      );

      const amount = ethers.utils.parseEther("100");
      await permissibleERC20.connect(owner).mint(account1.address, amount);
      expect(await permissibleERC20.balanceOf(account1.address)).to.equal(
        amount
      );

      const verifyingContract = permissibleERC20.address;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const name = await permissibleERC20.name();
      const version = "1";
      const permitOwner = account1.address;
      const spender = account2.address;
      const nonce = await permissibleERC20.nonces(permitOwner);
      const deadline = ethers.constants.MaxUint256;

      expect(await permissibleERC20.DOMAIN_SEPARATOR()).to.equal(
        await ethers.utils._TypedDataEncoder.hashDomain({
          name: name,
          version,
          chainId,
          verifyingContract,
        })
      );

      const data = getPermitERC712data(
        name,
        version,
        chainId,
        verifyingContract,
        permitOwner,
        spender,
        amount,
        nonce,
        deadline
      );

      const signature = await account1._signTypedData(
        data.domain,
        data.types,
        data.message
      );

      const { v, r, s } = ethers.utils.splitSignature(signature);

      await permissibleERC20
        .connect(account2)
        .permit(permitOwner, spender, amount, deadline, v, r, s);

      expect(await permissibleERC20.allowance(permitOwner, spender)).to.equal(
        amount
      );
    });
  });
});
