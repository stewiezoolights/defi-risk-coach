require("@chainlink/functions-toolkit-hardhat-plugin");
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  defaultNetwork: "baseSepolia",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org", // Base Sepolia RPC
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
