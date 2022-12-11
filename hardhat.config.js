require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
require('solidity-coverage')
require('hardhat-contract-sizer');
require("@nomiclabs/hardhat-ganache");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.16",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    ganache: {
      chainId: 1337,
      url: "http://127.0.0.1:7545",
      from: process.env.GANACHE_ACCOUNT,
      accounts: [
        '0540e5f2da553da8e4b4e5990503fafa74c07a772a646b5426b8f4cd8ee57aa6',
        '6a92ef7a0227bab2e1bd29adcc116ef7054db1a658f25c7f8845ebf41f6da3ee',
      ]
    },
/*
    goerli: {
        chainId:  4,
        timeout:  20000,
        gasPrice: 8000000000,
        gas:      "auto",
        name:     "Goerli",		
        url:      process.env.GOERLI_ACCESSPOINT_URL,
        from:     process.env.GOERLI_ACCOUNT,
        accounts: [process.env.GOERLI_PRIVATE_KEY]
	  }*/
  }
};
