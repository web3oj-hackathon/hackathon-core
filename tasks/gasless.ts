import { subtask, task } from "hardhat/config";
import * as ethSigUtil from "@metamask/eth-sig-util";
import axios from "axios";
import * as ethUtil from "ethereumjs-util";
import { toBN } from "@opengsn/provider";

const DOMAIN_NAME = "AAAA Platform";
const DOMAIN_VERSION = "1";
const REQUEST_TYPE = "Message";
const REQUEST_TYPE_SUFFIX = "bytes32 ABCDEFGHIJKLMNOPQRSTGSN)";

const types = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ],
  [REQUEST_TYPE]: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "gas", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "data", type: "bytes" },
    { name: "validUntilTime", type: "uint256" },
    { name: "ABCDEFGHIJKLMNOPQRSTGSN", type: "bytes32" },
  ],
};

task("gasless:send", "Deploy ERC20 contract")
  .addParam("contract")
  .addParam("to")
  .addParam("amount")
  .setAction(async (args, hre) => {
    const { contract, to, amount } = args;

    // get signer by env
    const account = hre.ethers.provider.getSigner();

    // get network info from node
    const network = await hre.ethers.provider.getNetwork();
    const hexChainId = hre.ethers.utils.hexValue(network.chainId);

    // get forwarder contract
    const Forwarder = await hre.ethers.getContractFactory("Forwarder");
    const forwarder = await Forwarder.attach(process.env.HACKATHON_FORWARDER_ADDRESS || "");

    console.log(`using chain id ${network.chainId}(${hexChainId})`);

    console.log(`using account ${await account.getAddress()}`);

    // get current nonce in forwarder contract
    const nonce = await forwarder.getNonce(account.getAddress());
    const hexNonce = hre.ethers.utils.hexValue(nonce);

    console.log(`using nonce ${nonce}(${hexNonce})`);

    // get gaslessERC20 contract
    const GaslessERC20 = await hre.ethers.getContractFactory("GaslessERC20");
    const gaslessERC20 = await GaslessERC20.attach(contract);

    // get desired transaction data
    const desiredTx = await gaslessERC20.populateTransaction.transfer(to, hre.ethers.utils.parseEther(amount));
    const estimatedGas = hre.ethers.utils.hexlify(700000);

    const domain = {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: ethUtil.bnToHex(toBN(network.chainId)),
      verifyingContract: process.env.HACKATHON_FORWARDER_ADDRESS,
    };

    const message = {
      data: desiredTx.data,
      from: await account.getAddress(),
      gas: estimatedGas,
      nonce: hexNonce,
      to: desiredTx.to,
      validUntilTime: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      value: "0x0",
    };

    const dataToSign = {
      domain,
      types,
      primaryType: REQUEST_TYPE,
      message: {
        ...message,
        ABCDEFGHIJKLMNOPQRSTGSN: Buffer.from(REQUEST_TYPE_SUFFIX, "utf8"),
      },
    };

    const signature = ethSigUtil.signTypedData({
      privateKey: Buffer.from(process.env.PRIVATE_KEY || "", "hex"),
      data: dataToSign,
      version: ethSigUtil.SignTypedDataVersion.V4,
    });

    // // recover test locally. This may be always success.
    const recovered = ethSigUtil.recoverTypedSignature({
      data: dataToSign,
      signature,
      version: ethSigUtil.SignTypedDataVersion.V4,
    });

    if (recovered.toLowerCase() !== (await account.getAddress()).toLowerCase()) {
      throw new Error("Invalid signature");
    }

    const forwardRequest = {
      domain,
      types,
      primaryType: REQUEST_TYPE,
      message,
    };

    // forwardRequest.types[REQUEST_TYPE] = forwardRequest.types[REQUEST_TYPE].slice(0, -1);

    // convert to relay tx.
    const relayTx = {
      forwardRequest: forwardRequest,
      metadata: {
        signature: signature.slice(2),
      },
    };

    console.log(JSON.stringify(relayTx, null, 2));

    // encode relay tx with relay server `eth_sendRawTransaction` format.
    const hexRawTx = "0x" + Buffer.from(JSON.stringify(relayTx)).toString("hex");

    // wrap relay tx with json rpc request format.
    const fetchBody = {
      id: 1,
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      params: [hexRawTx],
    };

    // send relay tx to relay server
    try {
      console.log(`relayer server : ${process.env.HACKATHON_RELAYER_URL}`);
      const result = await axios.post(process.env.HACKATHON_RELAYER_URL as string, fetchBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const txHash = result.data.result;

      console.log(`txHash : ${txHash}`);

      // wait for tx mined
      const receipt = await hre.ethers.provider.waitForTransaction(txHash);

      console.log(`tx mined : ${JSON.stringify(receipt, null, 2)}`);
    } catch (e: any) {
      console.error(e.response.data);
    }
  });
