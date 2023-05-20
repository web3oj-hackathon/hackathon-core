const ethSigUtil = require("@metamask/eth-sig-util");

const testData = {
  forwardRequest: {
    domain: {
      name: "my domain name",
      version: "my domain version",
      chainId: "0x1e8789",
      verifyingContract: "0x52c84043cd9c865236f11d9fc9f56aa003c1f922",
    },
    types: {
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
    },
    primaryType: "Message",
    message: {
      data: "d09de08a",
      from: "0xc41cb13576ae51927435366dc2de8121d5d67266",
      gas: "0x7b17",
      nonce: "0x0",
      to: "0x5db9a7629912ebf95876228c24a848de0bfb43a9",
      validUntilTime: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      value: "0x0",
      typeSuffixDatadatadatada: Buffer.from("bytes8 typeSuffixDatadatadatada)", "utf8"),
    },
  },
  metadata: {
    signature:
      "7a822b07b37ab4cfb8dbd9e8c70170cc12b1a8e3d0b15c8a4816da0d6832be7b3818666163ac9b523884cef593f6b706f0b2bb95a9bf51332be4b789dc2227761c",
  },
};

const testRecovered = ethSigUtil.recoverTypedSignature({
  data: testData.forwardRequest,
  signature: "0x" + testData.metadata.signature,
  version: ethSigUtil.SignTypedDataVersion.V4,
});

console.log(testRecovered);
