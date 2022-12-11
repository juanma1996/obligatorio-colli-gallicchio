 /// --------------------------------------------------------------------------------------------------
/// ToDo: Place your contract test code here
/// --------------------------------------------------------------------------------------------------
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const { getContractAddress } = require('@ethersproject/address')

const chai = require("chai");
const { solidity } = require( "ethereum-waffle");
const { ConstructorFragment } = require("ethers/lib/utils");
const { Console } = require("console");
chai.use(solidity);
const { expect } = chai;

const contractPolygonPath = "contracts/ERC20_Polygon.sol:ERC20_Polygon";
const polygonBridgeContractPath = "contracts/Bridge_Polygon.sol:Bridge_Polygon";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractPolygonInstance;
let polygonBridgeContractInstance;

// Constructor parameters
const name = "Obli_Token";
const symbol = "OTKN";

describe("Bridge Polygon tests", () => {
    before(async () => {
      
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- Bridge Polygon tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, account2, account3, account4] = await ethers.getSigners();
        provider = ethers.provider;

        // Deploy Token Contract
        const maxSupplyERC20Polygon = ethers.utils.parseEther("1000000");
        const contractFactoryPolygon = await ethers.getContractFactory(contractPolygonPath, signer);
        contractPolygonInstance = await contractFactoryPolygon.deploy(name, symbol, maxSupplyERC20Polygon);

        // Deploy Polygon Bridge Contract
        const polygonBridgeContractFactory = await ethers.getContractFactory(polygonBridgeContractPath, signer);
        polygonBridgeContractInstance = await polygonBridgeContractFactory.deploy(contractPolygonInstance.address);

    });

    describe("Constructor tests", () => {
        it("Try send zero address in ERC20 Address value", async () => {
            const polygonBridgeContractFactory = await ethers.getContractFactory(polygonBridgeContractPath, signer);
            await expect(polygonBridgeContractFactory.deploy(zeroAddress)).to.be.revertedWith("Invalid address _erc20Contract");
        });

        it("Try send ERC20 address that not is a Contract", async () => {
            const polygonBridgeContractFactory = await ethers.getContractFactory(polygonBridgeContractPath, signer);
            await expect(polygonBridgeContractFactory.deploy(account1.address)).to.be.revertedWith("_erc20Contract is not a contract");
        });
    });

    describe("mintTO tests", () => {
        it("Try send not protocol owner in _owner", async () => {
            const newInstancePolygonBridgeContract = await polygonBridgeContractInstance.connect(account1);
            await expect(newInstancePolygonBridgeContract.mintTo(account1.address, 0)).to.be.revertedWith("Not authorized");
        });

        it("Try send zero address  in _to value", async () => {
            await expect(polygonBridgeContractInstance.mintTo(zeroAddress, 0)).to.be.revertedWith("_to cannot be zero address");
        });

        it("Try send _to value in Black List", async () => {
            const tx = await polygonBridgeContractInstance.addAddressToBlackList(account2.address);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            await expect(polygonBridgeContractInstance.mintTo(account2.address, 0)).to.be.revertedWith("_to address is in blacklist");
        });

        it("Try send zero value in _tokenAmount", async () => {
            await expect(polygonBridgeContractInstance.mintTo(account1.address, 0)).to.be.revertedWith("_tokenAmount must be greater than zero");
        });

        it("Try send zero value in _tokenAmount", async () => {
            const maxSupply = await contractPolygonInstance.maxSupply();
            const totalSupply = await contractPolygonInstance.totalSupply();
            const dif = maxSupply.sub(totalSupply);
            const totalSupplyERC20 = dif.add(1);
            await expect(polygonBridgeContractInstance.mintTo(account1.address, totalSupplyERC20)).to.be.revertedWith("_tokenAmount exceeds max supply");
        });

        it("Try send not owner as sender", async () => {
            const newInstancePolygonBridgeContract = await polygonBridgeContractInstance.connect(account4);
            await expect(newInstancePolygonBridgeContract.mintTo(account4.address, 0)).to.be.revertedWith("Not authorized");
        });

        it("Try Mint TO OK", async () => {
            const transferAmount = ethers.utils.parseEther("10");

            const balanceAccount3Before = await contractPolygonInstance.balanceOf(account3.address);

            const tx2 = await polygonBridgeContractInstance.mintTo(account3.address, transferAmount);
            tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
            if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
               throw new Error("Transaction failed");
            }

            const balanceAccount3After = await contractPolygonInstance.balanceOf(account3.address);
            expect(balanceAccount3After).to.be.equals(balanceAccount3Before.add(transferAmount));
             // Check event emited
             const eventSignature = "MintOrder(address,uint256)";
             const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

             // Receipt information
            const eventSignatureHashReceived = tx_result2.logs[0].topics[0];
            const eventToParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result2.logs[0].topics[1])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result2.logs[0].data)[0];

            // Check event signature
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventToParametrReceived).to.be.equals(account3.address);
             // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(transferAmount);
        });
    })

    describe("transferToEthereum tests", () => {
        it("Try send _recipient value in Black List", async () => {
            await expect(polygonBridgeContractInstance.transferToEthereum(0, account2.address)).to.be.revertedWith("_recipient address is in blacklist");
        });

        it("Try send zero address  in _recipient value", async () => {
            await expect(polygonBridgeContractInstance.transferToEthereum(0, zeroAddress)).to.be.revertedWith("_recipient cannot be zero address");
        });

        it("Try send zero value in _tokenAmount", async () => {
            await expect(polygonBridgeContractInstance.transferToEthereum(0, account4.address)).to.be.revertedWith("_tokenAmount must be greater than zero");
        });

        it("Try send not owner as sender", async () => {
            const newInstancePolygonBridgeContract = await polygonBridgeContractInstance.connect(account4);
            await expect(newInstancePolygonBridgeContract.transferToEthereum(0, account4.address)).to.be.revertedWith("Not authorized");
        });

        it("Try send insufficient balance", async () => {
            const transferAmount = ethers.utils.parseEther("11");
            await expect(polygonBridgeContractInstance.transferToEthereum(transferAmount, account3.address)).to.be.revertedWith("_tokenAmount value exceed balance");
        });

        it("Try Transfer To Ethereum OK", async () => {
            const transferAmount = ethers.utils.parseEther("10");
            const balanceAccount3Before = await contractPolygonInstance.balanceOf(account3.address);

           const tx2 = await polygonBridgeContractInstance.transferToEthereum(transferAmount, account3.address);
           tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
           if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
               throw new Error("Transaction failed");
           }

            const balanceAccount3After = await contractPolygonInstance.balanceOf(account3.address);
            expect(balanceAccount3After).to.be.equals(balanceAccount3Before.sub(transferAmount));

             // Check event emited
             const eventSignature = "TransferToEthereum(address,uint256)";
             const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

             // Receipt information
            const eventSignatureHashReceived = tx_result2.logs[1].topics[0];
            const eventToParametrFrom = ethers.utils.defaultAbiCoder.decode(['address'], tx_result2.logs[1].topics[1])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result2.logs[1].data)[0];

            // Check event signature
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventToParametrFrom).to.be.equals(account3.address);
             // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(transferAmount); 
        });
    });
});