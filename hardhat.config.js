require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_SEPOLIA_RPC =
  process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
