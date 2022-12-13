const { ethers } = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

// Contract to deploy
const erc20PolygonPath = "contracts/ERC20_Polygon.sol:ERC20_Polygon";
const bridgePolygonPath = "contracts/Bridge_Polygon.sol:Bridge_Polygon";

async function main() {

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Deploy contracts process start...");
    console.log("---------------------------------------------------------------------------------------");

    /// --------------------------------------------------------------------------------------------------
    /// ToDo: Place your deploy code here
    /// --------------------------------------------------------------------------------------------------
    // Get Signer
    const [signer] = await ethers.getSigners();
    
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
    /// START POLYGON ETHEREUM
    /// -------------------------------------------------------------------------------------------------

    // Deploy BRIDGE Polygon
    const polygonBridgeContractFactory = await ethers.getContractFactory(bridgePolygonPath, signer);
    polygonBridgeInstance = await polygonBridgeContractFactory.deploy(erc20PolygonInstance.address);

    /// --------------------------------------------------------------------------------------------------
    /// FINISH BRIDGE POLYGON
    /// --------------------------------------------------------------------------------------------------

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- ERC20 Polygon Address:", erc20PolygonInstance.address);
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Polygon Bridge Address:", polygonBridgeInstance.address);
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