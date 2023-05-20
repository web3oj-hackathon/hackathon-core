import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks/deploy-erc20";
import "./tasks/register";
import "./tasks/gasless";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.7.6",
      },
    ],
  },
  networks: {
    hardhat: {},
    hackathon: {
      url: process.env.HACKATHON_RPC_URL,
      gasPrice: 700000000000,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
};

export default config;
