import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";
import { IForwarder } from "../typechain-types/contracts/IForwarder";

const EIP712_DOMAIN_TYPE =
  "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
const GENERIC_PARAMS =
  "address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntilTime";

function getForwardRequestData(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string,
  from: string,
  to: string,
  value: BigNumber,
  gas: BigNumber,
  nonce: BigNumber,
  data: string,
  validUntilTime: BigNumber
) {
  const domain = {
    name: name,
    version: version,
    chainId: chainId,
    verifyingContract: verifyingContract,
  };
  const types = {
    Message: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "gas", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "validUntilTime", type: "uint256" },
    ],
  };
  const message = {
    from: from,
    to: to,
    value: value,
    gas: gas,
    nonce: nonce,
    data: data,
    validUntilTime: validUntilTime,
  };

  return {
    domain: domain,
    types: {
      Message: types.Message,
    },
    primaryType: "Message",
    message: message,
  };
}

function getDomainValueAndHash(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string
) {
  const domainValue = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "bytes32", "bytes32", "uint256", "address"],
    [
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(EIP712_DOMAIN_TYPE)),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(version)),
      chainId,
      verifyingContract,
    ]
  );
  return {
    domainValue,
    domainHash: ethers.utils.keccak256(domainValue),
  };
}

function getRequestTypeAndHash(
  requestTypeName: string,
  requestTypeSuffix: string
) {
  const requestType =
    requestTypeName + "(" + GENERIC_PARAMS + "," + requestTypeSuffix;
  const requestTypeHash = ethers.utils.solidityKeccak256(
    ["string"],
    [requestType]
  );
  return {
    requestType,
    requestTypeHash,
  };
}

describe("GaslessCounter", function () {
  async function deployForwarderGaslessCounterFixture() {
    const [forwarderOwner, gaslessCounterOwner, account1, account2] =
      await ethers.getSigners();

    const Forwarder = await ethers.getContractFactory("Forwarder");
    const forwarder = await Forwarder.connect(forwarderOwner).deploy();
    await forwarder.deployed();

    const GaslessCounter = await ethers.getContractFactory("GaslessCounter");
    const gaslessCounter = await GaslessCounter.connect(
      gaslessCounterOwner
    ).deploy(forwarder.address);
    await gaslessCounter.deployed();

    return {
      forwarder,
      gaslessCounter,
      forwarderOwner,
      gaslessCounterOwner,
      account1,
      account2,
    };
  }

  describe("Deployment", function () {
    it("Deployment should assign forwarder", async function () {
      const { forwarder, gaslessCounter } = await loadFixture(
        deployForwarderGaslessCounterFixture
      );

      expect(await gaslessCounter.getTrustedForwarder()).to.equal(
        forwarder.address
      );
    });
  });

  describe("Forwarder", function () {
    it("Register DomainSeparator", async function () {
      const { forwarder, forwarderOwner } = await loadFixture(
        deployForwarderGaslessCounterFixture
      );

      const chainId = await ethers.provider
        .getNetwork()
        .then((network) => network.chainId);
      const domainSeparatorName = "my domain name";
      const domainSeparatorVersion = "1";

      const domain = getDomainValueAndHash(
        domainSeparatorName,
        domainSeparatorVersion,
        chainId,
        forwarder.address
      );

      await expect(
        forwarder
          .connect(forwarderOwner)
          .registerDomainSeparator(domainSeparatorName, domainSeparatorVersion)
      )
        .to.emit(forwarder, "DomainRegistered")
        .withArgs(domain.domainHash, domain.domainValue);
    });

    it("Register RequestType", async function () {
      const { forwarder, forwarderOwner } = await loadFixture(
        deployForwarderGaslessCounterFixture
      );

      const requestTypeName = "my type name";
      const requestTypeSuffix = "bytes8 typeSuffixDatadatadatada)";

      const requestTypeAndHash = getRequestTypeAndHash(
        requestTypeName,
        requestTypeSuffix
      );
      await expect(
        forwarder.registerRequestType(requestTypeName, requestTypeSuffix)
      )
        .to.emit(forwarder, "RequestTypeRegistered")
        .withArgs(
          requestTypeAndHash.requestTypeHash,
          requestTypeAndHash.requestType
        );
    });
  });

  describe("Forwarder Call GaslessCounter Function", function () {
    it("Should increment counter", async function () {
      const { forwarder, gaslessCounter, forwarderOwner, account1 } =
        await loadFixture(deployForwarderGaslessCounterFixture);

      const chainId = await ethers.provider
        .getNetwork()
        .then((network) => network.chainId);
      const domainSeparatorName = "my domain name";
      const domainSeparatorVersion = "1";

      await forwarder
        .connect(forwarderOwner)
        .registerDomainSeparator(domainSeparatorName, domainSeparatorVersion);

      const domain = getDomainValueAndHash(
        domainSeparatorName,
        domainSeparatorVersion,
        chainId,
        forwarder.address
      );

      const requestTypeName = "my type name";
      const requestTypeSuffix = "bytes8 typeSuffixDatadatadatada)";

      const requestTypeAndHash = getRequestTypeAndHash(
        requestTypeName,
        requestTypeSuffix
      );

      await forwarder
        .connect(forwarderOwner)
        .registerRequestType(requestTypeName, requestTypeSuffix);

      const nonce = await forwarder.getNonce(account1.address);

      const data = gaslessCounter.interface.encodeFunctionData("increment");

      const name = "my name";
      const version = "1";
      const deadline = ethers.constants.MaxUint256;
      const value = BigNumber.from(0);
      const gas = BigNumber.from(0x1d0f6);
      const from = account1.address;
      const to = gaslessCounter.address;

      const forwardRequestData = getForwardRequestData(
        name, // name
        version, // version
        chainId, // chainId
        forwarder.address, // verifyingContract
        from, // from
        to, // to
        value, // value
        gas, // gas
        nonce, // nonce
        data, // data
        deadline // validUntilTime
      );

      // account1 signs the request
      const signature = await account1._signTypedData(
        forwardRequestData.domain,
        forwardRequestData.types,
        forwardRequestData.message
      );

      const req: IForwarder.ForwardRequestStruct = {
        from: from,
        to: to,
        value: value,
        gas: gas,
        nonce: nonce,
        data: data,
        validUntilTime: deadline,
      };

      // forwarder executes the request
      await forwarder
        .connect(forwarderOwner)
        .execute(
          req,
          domain.domainHash,
          requestTypeAndHash.requestTypeHash,
          data,
          signature
        );

      // counter should be incremented
      expect(await gaslessCounter.getNumber()).to.equal(1);
    });
  });
});
