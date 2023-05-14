import { ethers, version } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";
import ethSigUtil, { SignTypedDataVersion } from "@metamask/eth-sig-util";

interface MessageTypeProperty {
  name: string;
  type: string;
}
interface MessageTypes {
  EIP712Domain: MessageTypeProperty[];
  [additionalProperties: string]: MessageTypeProperty[];
}

function getEIP712Message(
  domainName: string,
  domainVersion: string,
  chainId: number,
  forwarderAddress: string,
  data: string,
  from: string,
  to: string,
  gas: BigNumber,
  nonce: BigNumber
) {
  const types = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    Message: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "gas", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "validUntilTime", type: "uint256" },
      { name: "typeSuffixDatadatadatada", type: "bytes32" },
    ],
  };

  const message = {
    data: data,
    from: from,
    gas: gas,
    nonce: nonce,
    to: to,
    validUntilTime: String(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    ),
    value: String("0x0"),
  };

  const messageTypes: MessageTypes = {
    EIP712Domain: types.EIP712Domain,
    Message: types.Message,
  };

  const result = {
    domain: {
      name: domainName,
      version: domainVersion,
      chainId: chainId,
      verifyingContract: forwarderAddress,
    },
    types: messageTypes,
    primaryType: "Message",
    message: message,
  };

  return result;
}

async function main() {
  const [account] = await ethers.getSigners();
  const forwarderAddress = process.env.FORWARDER_ADDRESS;
  if (!forwarderAddress) {
    throw new Error("FORWARDER_ADDRESS not set");
  }

  // forwarder attach
  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.attach(forwarderAddress);

  // gaslessCounter deploy
  const GaslessCounter = await ethers.getContractFactory("GaslessCounter");
  const gaslessCounter = await GaslessCounter.deploy(forwarder.address);
  await gaslessCounter.deployed();
  console.log("GaslessCounter deployed to:", gaslessCounter.address);

  // register domain separator
  const chainId = await ethers.provider
    .getNetwork()
    .then((network) => network.chainId);
  const domainSeparatorName = "my domain name";
  const domainSeparatorVersion = "1";

  const registerDomainSeparatorTx = await forwarder.registerDomainSeparator(
    domainSeparatorName,
    domainSeparatorVersion
  );
  const registerDomainSeparatorTxReceipt =
    await registerDomainSeparatorTx.wait();
  if (!registerDomainSeparatorTxReceipt.status) {
    throw new Error("registerDomainSeparatorTx failed");
  } else {
    console.log("registerDomainSeparatorTx success");
  }

  // register request type
  const requestTypeName = "my type name";
  const requestTypeSuffix = "bytes8 typeSuffixDatadatadatada)";

  const registerRequestTypeTx = await forwarder.registerRequestType(
    requestTypeName,
    requestTypeSuffix
  );

  const registerRequestTypeTxReceipt = await registerRequestTypeTx.wait();
  if (!registerRequestTypeTxReceipt.status) {
    throw new Error("registerRequestTypeTx failed");
  } else {
    console.log("registerRequestTypeTx success");
  }

  // eip712 message
  const nonce = await forwarder.getNonce(account.address);

  const eip712Message = getEIP712Message(
    domainSeparatorName,
    domainSeparatorVersion,
    chainId,
    forwarderAddress,
    "0xd09de08a", // increment()
    account.address,
    gaslessCounter.address,
    BigNumber.from(4000000),
    nonce
  );

  const dataToSign = {
    domain: eip712Message.domain,
    types: eip712Message.types,
    primaryType: eip712Message.primaryType,
    message: {
      ...eip712Message.message,
      typeSuffixDatadatadatada: Buffer.from(requestTypeSuffix, "utf8"),
    },
  };

  const accountPrivateKey = process.env.PRIVATE_KEY;
  if (!accountPrivateKey) {
    throw new Error("PRIVATE_KEY not set");
  }

  const sig = ethSigUtil.signTypedData({
    privateKey: Buffer.from(accountPrivateKey, "hex"),
    data: dataToSign,
    version: SignTypedDataVersion.V4,
  });
  console.log("sig: ", sig);

  const ecRecover = ethSigUtil.recoverTypedSignature({
    data: dataToSign,
    signature: sig,
    version: SignTypedDataVersion.V4,
  });

  console.log("ecRecover: ", ecRecover);

  const tx = {
    forwardRequest: eip712Message,
    metadata: {
      signature: sig.substring(2),
    },
  };

  const rawTx = "0x" + Buffer.from(JSON.stringify(tx)).toString("hex");
  console.log(rawTx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
