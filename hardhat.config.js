require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
require('solidity-coverage')
require('hardhat-contract-sizer');

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
  goerli: {
    chainId:  5,
    timeout:  20000,
    gasPrice: 8000000000,
    gas:      "auto",
    name:     "Goerli",		
    url:      process.env.GOERLI_ACCESSPOINT_URL,
    from:     process.env.GOERLI_ACCOUNTOWNER,
    accounts: [process.env.GOERLI_PRIVATE_OWNER, process.env.GOERLI_PRIVATE_TOKENVAULT]
  
  },
   /*   ganache: {
      chainId: 1337,
      url: "http://127.0.0.1:7545",
      from: process.env.GANACHE_ACCOUNT,
      accounts: [process.env.GANACHE_PRIVATE_KEY, process.env.GANACHE_PRIVATE_KEY2, process.env.GANACHE_PRIVATE_KEY3, process.env.GANACHE_PRIVATE_KEY4, process.env.GANACHE_PRIVATE_KEY5, process.env.GANACHE_PRIVATE_KEY6, process.env.GANACHE_PRIVATE_KEY7]
    },*/
  }
};
