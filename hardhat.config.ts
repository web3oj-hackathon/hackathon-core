require("dotenv").config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hackathon: {
      url: process.env.RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY || ""],
      gasPrice: 700000000000,
    },
  },
};

export default config;
