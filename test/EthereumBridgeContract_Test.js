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

const contractPath = "contracts/TokenContract.sol:TokenContract";
const ethereumBridgeContractPath = "contracts/EthereumBridgeContract.sol:EthereumBridgeContract";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractInstance;
let ethereumBridgeContractInstance;

// Constructor parameters
const name = "Obli_Token";
const symbol = "OTKN";

describe("Ethereum Bridge Contract tests", () => {
    before(async () => {
      
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- Ethereum Bridge Contract tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, account2, account3, account4] = await ethers.getSigners();
        provider = ethers.provider;

        const maxSupplyToken = ethers.utils.parseEther("50");

        // Deploy Token Contract
        const contractFactory = await ethers.getContractFactory(contractPath, signer);
        contractInstance = await contractFactory.deploy(name, symbol);

        // Deploy Ethereum Bridge Contract
        const ethereumBridgeContractFactory = await ethers.getContractFactory(ethereumBridgeContractPath, signer);
        ethereumBridgeContractInstance = await ethereumBridgeContractFactory.deploy(contractInstance.address, maxSupplyToken);

    });

    describe("Constructor tests", () => {
        it("Try send zero address in ERC20 Address value", async () => {
            const ethereumBridgeContractFactory = await ethers.getContractFactory(ethereumBridgeContractPath, signer);
            await expect(ethereumBridgeContractFactory.deploy(zeroAddress, 0)).to.be.revertedWith("erc20Conctract cannot be zero address");
        });

        it("Try MaxSupply OK", async () => {
            const maxSupplyToken = ethers.utils.parseEther("50");
            const maxSupplyTokenSet = await ethereumBridgeContractInstance.maxSupply();
            expect(parseInt(maxSupplyTokenSet)).to.be.equals(parseInt(maxSupplyToken));
        });

        it("Try Owner OK", async () => {
           expect(await ethereumBridgeContractInstance.owner()).to.be.equals(signer.address);
        });
    });

    describe("Transfer To Polygon tests", () => {

        it("Try send zero value in _tokenAmount", async () => {
            await expect(ethereumBridgeContractInstance.transferToPolygon(0)).to.be.revertedWith("_tokenAmount must be greater than zero");
        });

        it("Try send exceeds max suply", async () => {
            const transferAmount = ethers.utils.parseEther("51");
            await expect(ethereumBridgeContractInstance.transferToPolygon(transferAmount)).to.be.revertedWith("_tokenAmount exceeds max supply");
        });

        it("Try send with sender in Black List", async () => {
            const transferAmount = ethers.utils.parseEther("10");

            const tx = await ethereumBridgeContractInstance.addAddressToBlackList(account3.address);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

             const newInstanceEthereumBridgeContract = await ethereumBridgeContractInstance.connect(account3);

            await expect(newInstanceEthereumBridgeContract.transferToPolygon(transferAmount)).to.be.revertedWith("Invalid sender");
        });

        it("Try send with insufficient balance", async () => {
            const transferAmount = ethers.utils.parseEther("10");

            const newInstanceEthereumBridgeContract = await ethereumBridgeContractInstance.connect(account3);

            const tx = await ethereumBridgeContractInstance.removeAddressFromBlackList(account3.address);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            await expect(newInstanceEthereumBridgeContract.transferToPolygon(transferAmount)).to.be.revertedWith("Insufficient balance");
        });

        it("Transfer To Polygon with not allowance", async () => {
            const transferAmount = ethers.utils.parseEther("10");

            const newInstanceEthereumBridgeContract = await ethereumBridgeContractInstance.connect(account3);
           
            const tx = await contractInstance.transfer(account3.address, transferAmount);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

           await expect(newInstanceEthereumBridgeContract.transferToPolygon(transferAmount)).to.be.revertedWith("transferFrom - Insufficent allowance");
           
        });

        it("Transfer To Polygon OK", async () => {
            const transferAmount = ethers.utils.parseEther("10");

            const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
            const ethereumBridgeContractBalanceBefore = await contractInstance.balanceOf(ethereumBridgeContractInstance.address);
            const totalSupplyBefore = await ethereumBridgeContractInstance.totalSupply();

            const newInstanceEthereumBridgeContract = await ethereumBridgeContractInstance.connect(account3);
            
            const newContractInstance = await contractInstance.connect(account3);

            const tx = await newContractInstance.approve(ethereumBridgeContractInstance.address, transferAmount);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            const tx2 = await newInstanceEthereumBridgeContract.transferToPolygon(transferAmount);
            tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
            if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
               throw new Error("Transaction failed");
            }

            const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
            const ethereumBridgeContractBalanceAfter = await contractInstance.balanceOf(ethereumBridgeContractInstance.address);
            const totalSupplyAfter = await ethereumBridgeContractInstance.totalSupply();
            expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore - transferAmount));
            expect(parseInt(ethereumBridgeContractBalanceAfter)).to.be.equals(parseInt(ethereumBridgeContractBalanceBefore + transferAmount));
            expect(parseInt(totalSupplyAfter)).to.be.equals(parseInt(totalSupplyBefore + transferAmount));

             // Check event emited
             const eventSignature = "TransferToPolygon(address,uint256)";
             const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

             // Receipt information
            const eventSignatureHashReceived = tx_result2.logs[0].topics[0];
            const eventSenderParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result2.logs[0].topics[1])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signature
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventSenderParametrReceived).to.be.equals(account3.address);
             // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(transferAmount);
        });
    });

    describe("Add Address To Black List tests", () => {
        it("Try send zero address in _invalidAddress", async () => {
            await expect(ethereumBridgeContractInstance.addAddressToBlackList(zeroAddress)).to.be.revertedWith("_invalidAddress cannot be zero address");
        });

        it("Try send owner protocol address in _invalidAddress", async () => {
            await expect(ethereumBridgeContractInstance.addAddressToBlackList(signer.address)).to.be.revertedWith("Invalid address _invalidAddress");
        });

        it("Try send same address in _invalidAddress", async () => {
            const tx = await ethereumBridgeContractInstance.addAddressToBlackList(account3.address);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }
            await expect(ethereumBridgeContractInstance.addAddressToBlackList(account3.address)).to.be.revertedWith("Address already in the list");
        });
    });

    describe("Remove Address from Black List tests", () => {
        it("Try send zero address in _invalidAddress", async () => {
            await expect(ethereumBridgeContractInstance.removeAddressFromBlackList(zeroAddress)).to.be.revertedWith("Invalid address _invalidAddress");
        });

        it("Try send remove address that not exists in the list", async () => {
            await expect(ethereumBridgeContractInstance.removeAddressFromBlackList(account4.address)).to.be.revertedWith("Address not found");
        });
    });

    describe("unStake To Polygon tests", () => {
        it("Try send not protocol owner in _owner", async () => {
            const newInstanceEthereumBridgeContract = await ethereumBridgeContractInstance.connect(account2);
            await expect(newInstanceEthereumBridgeContract.unStake(account3.address, 0)).to.be.revertedWith("Not authorized");
        });

        it("Try send zero address in _owner", async () => {
            await expect(ethereumBridgeContractInstance.unStake(zeroAddress, 0)).to.be.revertedWith("_owner cannot be zero address");
        });

        it("Try send with sender in Black List", async () => {
            const tx = await ethereumBridgeContractInstance.addAddressToBlackList(account2.address);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            await expect(ethereumBridgeContractInstance.unStake(account2.address, 0)).to.be.revertedWith("_owner address is in blacklist");
        });

        it("Try send with account without stake", async () => {
            const unStakeAmount = ethers.utils.parseEther("10");
            await expect(ethereumBridgeContractInstance.unStake(account1.address, unStakeAmount)).to.be.revertedWith("_owner address has no stake");
        });

        it("Try send zero value in _tokenAmount", async () => {
            await expect(ethereumBridgeContractInstance.unStake(account1.address, 0)).to.be.revertedWith("_tokenAmount must be greater than zero");
        });

        it("Try send different value in _tokenAmount that hace in stake", async () => {
            const unStakeAmount = ethers.utils.parseEther("12");
            const tx = await ethereumBridgeContractInstance.removeAddressFromBlackList(account3.address);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }
            const newInstanceEthereumBridgeContract = await ethereumBridgeContractInstance.connect(account3);
            await expect(ethereumBridgeContractInstance.unStake(account3.address, unStakeAmount)).to.be.revertedWith("_tokenAmount value exceed staking");
            
        });

        it("UnStake OK", async () => {
            const transferAmount = ethers.utils.parseEther("10");

            const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
            const ethereumBridgeContractBalanceBefore = await contractInstance.balanceOf(ethereumBridgeContractInstance.address);

            const tx2 = await ethereumBridgeContractInstance.unStake(account3.address, transferAmount);
            tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
            if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
               throw new Error("Transaction failed");
            }

            const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
            const ethereumBridgeContractBalanceAfter = await contractInstance.balanceOf(ethereumBridgeContractInstance.address);
            expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore + transferAmount));
            expect(parseInt(ethereumBridgeContractBalanceAfter)).to.be.equals(parseInt(ethereumBridgeContractBalanceBefore - transferAmount));

           
        }); 
    });
});