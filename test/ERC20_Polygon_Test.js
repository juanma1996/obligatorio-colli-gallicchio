/// --------------------------------------------------------------------------------------------------
/// ToDo: Place your contract test code here
/// --------------------------------------------------------------------------------------------------
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

const chai = require("chai");
const { solidity } = require( "ethereum-waffle");
const { ConstructorFragment } = require("ethers/lib/utils");
const { Console } = require("console");
chai.use(solidity);
const { expect } = chai;

const contractPath = "contracts/ERC20_Polygon.sol:ERC20_Polygon";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractInstance;

// Constructor parameters
const name = "Obli_TokenPol";
const symbol = "OTKP";

describe("ERC20 Polygon tests", () => {
    before(async () => {
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- ERC20 Polygon tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, account2, account3] = await ethers.getSigners();
        provider = ethers.provider;

        const maxSupplyToken = ethers.utils.parseEther("1000000");

        // Deploy ERC20 Ethereum
        const contractFactory = await ethers.getContractFactory(contractPath, signer);
        contractInstance = await contractFactory.deploy(name, symbol, maxSupplyToken);
        
    });

    describe("Constructor tests", () => {
        it("Try send empty name", async () => {
            const contractFactory = await ethers.getContractFactory(contractPath, signer);
            await expect(contractFactory.deploy("", "", 0)).to.be.revertedWith("constructor - Invalid parameter: _name");
        });

        it("Try send empty symbol", async () => {
            const contractFactory = await ethers.getContractFactory(contractPath, signer);
            await expect(contractFactory.deploy("Test", "", 0)).to.be.revertedWith("constructor - Invalid parameter: _symbol");
        });

        it("Initialization test", async () => {
            const maxSupplyToken = ethers.utils.parseEther("1000000");
            const receivedName = await contractInstance.name();
            const receivedSymbol = await contractInstance.symbol();
            const receivedMaxSupply = await contractInstance.maxSupply();
            const receivedTotalSupply = await contractInstance.totalSupply();

            expect(receivedName).to.be.equals(name);
            expect(receivedSymbol).to.be.equals(symbol);
            expect(receivedMaxSupply).to.be.equals(maxSupplyToken);
            expect(receivedTotalSupply).to.be.equals(0);
            
        });
    });

    describe("Mint tests", () => {

        it("Try mint to zero address", async () => {
            const amountToMint = ethers.utils.parseEther("1");
            await expect(contractInstance.mint(zeroAddress, 0)).to.be.revertedWith("mint - Invalid parameter: _recipient");
        });

        it("Try mint with zero amount", async () => {
            const amountToMint = ethers.utils.parseEther("0");
            await expect(contractInstance.mint(signer.address, amountToMint)).to.be.revertedWith("mint - Invalid parameter: _amountToMint");
        });

        it("Try mint an amount that overcame the maximum supply", async () => {
            const amountToMint = ethers.utils.parseEther("1000001");
            await expect(contractInstance.mint(signer.address, amountToMint)).to.be.revertedWith("mint - Total supply exceeds maximum supply");
        });

        it("Mint 1000 tokens to signer account", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const totalSupplyBefore = await contractInstance.totalSupply();

            const amountToMint = ethers.utils.parseEther("1000");
            const tx = await contractInstance.mint(signer.address, amountToMint);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const totalSupplyAfter = await contractInstance.totalSupply();

            expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) + parseInt(amountToMint));
            expect(parseInt(totalSupplyAfter)).to.be.equals(parseInt(totalSupplyBefore) + parseInt(amountToMint));

        });
    });

    describe("Burn tests", () => {
        it("Try to burn from zero address", async () => {
            const amountToBurn = ethers.utils.parseEther("1");
            await expect(contractInstance.burn(zeroAddress, amountToBurn)).to.be.revertedWith("burn - Invalid parameter: _from");
        });
        
        it("Try to burn zero amount", async () => {
            const amountToBurn = ethers.utils.parseEther("0");
            await expect(contractInstance.burn(signer.address, amountToBurn)).to.be.revertedWith("burn - Invalid parameter: _value");
        });

        it("Try to burn an amount that overcame the signer balance", async () => {
            const amountToBurn = ethers.utils.parseEther("2000");
            await expect(contractInstance.burn(signer.address, amountToBurn)).to.be.revertedWith("burn - Insufficient balance");
        });

        it("Burn 500 tokens from signer account", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const totalSupplyBefore = await contractInstance.totalSupply();

            const amountToBurn = ethers.utils.parseEther("500");
            const tx = await contractInstance.burn(signer.address, amountToBurn);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const totalSupplyAfter = await contractInstance.totalSupply();

            expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) + parseInt(amountToBurn));
            expect(parseInt(totalSupplyAfter)).to.be.equals(parseInt(totalSupplyBefore) - parseInt(amountToBurn));

            // Check event emited
            const eventSignature = "Burn(address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(signer.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToBurn);
            
        });
    });

});