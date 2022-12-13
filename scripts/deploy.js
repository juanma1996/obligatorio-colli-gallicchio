const { ethers } = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

// Contract to deploy
const erc20EthereumPath = "contracts/ERC20_Ethereum.sol:ERC20_Ethereum";
const exchangePath = "contracts/Exchange.sol:Exchange";
const erc20PolygonPath = "contracts/ERC20_Polygon.sol:ERC20_Polygon";
const bridgeEthereumPath = "contracts/Bridge_Ethereum.sol:Bridge_Ethereum";
const bridgePolygonPath = "contracts/Bridge_Polygon.sol:Bridge_Polygon";

async function main() {

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Deploy contracts process start...");
    console.log("---------------------------------------------------------------------------------------");

    /// --------------------------------------------------------------------------------------------------
    /// ToDo: Place your deploy code here
    /// --------------------------------------------------------------------------------------------------
    // Get Signer
    const [signer, tokenVault] = await ethers.getSigners();
    const confirmations_number  =  1;
    
    //Get provider for testnet Ganache
    const accessPoint_URL = process.env.GANACHE_URL;
   
    const provider = new ethers.providers.JsonRpcProvider(accessPoint_URL);

    /// --------------------------------------------------------------------------------------------------
    /// START ERC20 ETHEREUM
    /// --------------------------------------------------------------------------------------------------
    const maxSupplyToken = ethers.utils.parseEther("2000000");
    const name = "Obli_Token";
    const symbol = "OTKN";

    // Deploy ERC20 Ethereum
    const contractFactory = await ethers.getContractFactory(erc20EthereumPath, signer);
    erc20EthereumInstance = await contractFactory.deploy(name, symbol, maxSupplyToken);

    /// --------------------------------------------------------------------------------------------------
    /// FINISH ERC20 ETHEREUM
    /// --------------------------------------------------------------------------------------------------

    /// --------------------------------------------------------------------------------------------------
    /// START EXCHANGE
    /// --------------------------------------------------------------------------------------------------

    // Deploy EXCHANGE
        const amountToTokenVault = ethers.utils.parseEther("250000");
        const amount= ethers.utils.parseEther("2");
        const amountTokenToStartPool = ethers.utils.parseEther("250000");

        const exchangeContractFactory = await ethers.getContractFactory(exchangePath, signer);
        const transactionCount = await signer.getTransactionCount()
            const futureAddress = getContractAddress({
                from: signer.address,
                nonce: transactionCount + 2
            })

        const tx = await erc20EthereumInstance.approve(futureAddress, amountTokenToStartPool);
        tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
        if(tx_result.confirmations < 0 || tx_result === undefined) {
            throw new Error("Transaction failed");
        }
        const tx3 = await erc20EthereumInstance.transfer(tokenVault.address, amountToTokenVault);
        tx_result3 = await provider.waitForTransaction(tx3.hash, confirmations_number);
        if(tx_result3.confirmations < 0 || tx_result3 === undefined) {
            throw new Error("Transaction failed");
        }
        exchangeInstance = await exchangeContractFactory.deploy(tokenVault.address, erc20EthereumInstance.address, amountTokenToStartPool, { value: amount });
        if(exchangeInstance.confirmations < 0 || exchangeInstance === undefined) {
            throw new Error("Transaction failed");
        }
    /// --------------------------------------------------------------------------------------------------
    /// FINISH EXCHANGE
    /// --------------------------------------------------------------------------------------------------

    /// --------------------------------------------------------------------------------------------------
    /// START ERC20 Polygon
    /// --------------------------------------------------------------------------------------------------
    const maxSupplyTokenPolygon = ethers.utils.parseEther("1000000");
    const nameTokenPolygon = "Obli_TokenPol";
    const symbolTokenPolygon = "OTKP";

    // Deploy ERC20 Polygon
    const contractFactoryErc20Polygon = await ethers.getContractFactory(erc20PolygonPath, signer);
    erc20PolygonInstance = await contractFactoryErc20Polygon.deploy(nameTokenPolygon, symbolTokenPolygon, maxSupplyTokenPolygon);

    /// --------------------------------------------------------------------------------------------------
    /// FINISH ERC20 Polygon
    /// --------------------------------------------------------------------------------------------------

    /// --------------------------------------------------------------------------------------------------
    /// START BRIDGE ETHEREUM
    /// -------------------------------------------------------------------------------------------------

    // Deploy BRIDGE Ethereum
    const ethereumBridgeContractFactory = await ethers.getContractFactory(bridgeEthereumPath, signer);
    ethereumBridgeInstance = await ethereumBridgeContractFactory.deploy(erc20EthereumInstance.address);

    /// --------------------------------------------------------------------------------------------------
    /// FINISH BRIDGE ETHEREUM
    /// --------------------------------------------------------------------------------------------------

    /// --------------------------------------------------------------------------------------------------
    /// START POLYGON ETHEREUM
    /// -------------------------------------------------------------------------------------------------

    // Deploy BRIDGE Polygon
    const polygonBridgeContractFactory = await ethers.getContractFactory(bridgePolygonPath, signer);
    polygonBridgeInstance = await polygonBridgeContractFactory.deploy(erc20PolygonInstance.address);

    /// --------------------------------------------------------------------------------------------------
    /// FINISH BRIDGE POLYGON
    /// --------------------------------------------------------------------------------------------------

    console.log("-- ERC20 Ethereum Address:", erc20EthereumInstance.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Exchange Address:", exchangeInstance.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- ERC20 Polygon Address:", erc20PolygonInstance.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Ethereum Bridge Address:", ethereumBridgeInstance.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Polygon Bridge Address:", polygonBridgeInstance.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- SIGNER Address:", signer.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- TOKEN VAULT Address:", tokenVault.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Contracts have been successfully deployed");
    console.log("---------------------------------------------------------------------------------------");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });