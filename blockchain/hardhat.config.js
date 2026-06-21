require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../server/.env" });

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun"
    }
  },
  networks: {
    localhost: {
  url: "http://127.0.0.1:8545",
  gas: 16000000,
  blockGasLimit: 16000000,
  gasPrice: "auto",
},
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      chainId: 137,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
};
