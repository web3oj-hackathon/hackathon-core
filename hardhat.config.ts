import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {},
    hackathon: {
      url: process.env.HACKATHON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
};

export default config;
