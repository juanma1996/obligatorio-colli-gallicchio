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

const contractPath = "contracts/ERC20_Ethereum.sol:ERC20_Ethereum";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractInstance;

// Constructor parameters
const name = "Obli_Token";
const symbol = "OTKN";


describe("ERC20 Ethereum tests", () => {
    before(async () => {
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- ERC20 Ethereum tests start");
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
            const receivedDecimals = await contractInstance.decimals();

            expect(receivedName).to.be.equals(name);
            expect(receivedSymbol).to.be.equals(symbol);
            expect(receivedMaxSupply).to.be.equals(maxSupplyToken);
            expect(receivedDecimals).to.be.equals(18);
            
        });
    });

    describe("Transfer tests", () => {
        it("Try transfer to zero address", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transfer(zeroAddress, amountToTransfer)).to.be.revertedWith("transfer - Invalid parameter: _to");
        });

        it("Try transfer zero amount", async () => {
            const amountToTransfer = ethers.utils.parseEther("0");
            await expect(contractInstance.transfer(account1.address, amountToTransfer)).to.be.revertedWith("transfer - Invalid parameter: _value");
        });

        it("Try transfer to the same account", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transfer(signer.address, amountToTransfer)).to.be.revertedWith("transfer - Invalid recipient, same as remittent");
        });

        it("Try transfer with insufficient balance", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            const newInstance = await contractInstance.connect(account1);
            await expect(newInstance.transfer(account2.address, amountToTransfer)).to.be.revertedWith("transfer - Insufficient balance");
        });

        it("Transfer 10 tokens to account1", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const account1BalanceBefore = await contractInstance.balanceOf(account1.address);
            const amountToTransfer = ethers.utils.parseEther("10");
           

            const tx = await contractInstance.transfer(account1.address, amountToTransfer);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const account1BalanceAfter = await contractInstance.balanceOf(account1.address);
   

            expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) - parseInt(amountToTransfer));
            expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) + parseInt(amountToTransfer));
       

            // Check event emited
            const eventSignature = "Transfer(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventToParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signature
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventToParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToTransfer);
        });
    });

    describe("Approve tests", () => {
        it("Try approve to zero address", async () => {
            const amountToApprove = ethers.utils.parseEther("1");
            await expect(contractInstance.approve(zeroAddress, amountToApprove)).to.be.revertedWith("approve - Invalid parameter: _spender");
        });

        it("Try approve with insufficient balance", async () => {
            const amountToApprove = ethers.utils.parseEther("1000001");
            await expect(contractInstance.approve(account1.address, amountToApprove)).to.be.revertedWith("approve - Insufficient balance");
        });

        it("Set approve for 10 tokens", async () => {
            const amountToApprove = ethers.utils.parseEther("10");
            const tx = await contractInstance.approve(account1.address, amountToApprove);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check result
            const amountApproved = await contractInstance.allowance(signer.address, account1.address);
            expect(amountApproved).to.be.equals(amountToApprove);

            // Check event emited
            const eventSignature = "Approval(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventOwnerParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventSpenderParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signature
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventOwnerParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventSpenderParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToApprove);
        });

        it("Set approve for zero amount", async () => {
            const amountToApprove = ethers.utils.parseEther("0");
            const tx = await contractInstance.approve(account1.address, amountToApprove);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check result
            const amountApproved = await contractInstance.allowance(signer.address, account1.address);
            expect(amountApproved).to.be.equals(amountToApprove);

            // Check event emited
            const eventSignature = "Approval(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventOwnerParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventSpenderParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventOwnerParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventSpenderParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToApprove);
        });

        it("Set approve for 20 tokens to account1", async () => {
            const amountToApprove = 20;
            const tx = await contractInstance.approve(account1.address, amountToApprove);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check result
            const amountApproved = await contractInstance.allowance(signer.address, account1.address);
            expect(amountApproved).to.be.equals(amountToApprove);

            // Check event emited
            const eventSignature = "Approval(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventOwnerParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventSpenderParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signature
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventOwnerParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventSpenderParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToApprove);
        });
    });

    describe("TransferFrom tests", () => {
        it("Try TransferFrom from zero address", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(zeroAddress, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _from");
        });
        
        it("Try TransferFrom to zero address", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(signer.address, zeroAddress, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _to");
        });

        it("Try TransferFrom zero amount", async () => {
            const amountToTransfer = ethers.utils.parseEther("0");
            await expect(contractInstance.transferFrom(signer.address, account1.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _value");
        });

        it("Try TransferFrom to the same account", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(signer.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid recipient, same as remittent");
        });

        it("Try TransferFrom with insufficient balance", async () => {
            const amountToTransfer = ethers.utils.parseEther("500001");
            await expect(contractInstance.transferFrom(account2.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficient balance");
        });
        
        it("Try TransferFrom with no allowance", async () => {
            const amountToTransfer = ethers.utils.parseEther("1");
            await expect(contractInstance.transferFrom(account1.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficent allowance");
        });

        it("Try TransferFrom with insufficent allowance", async () => {
            const amountToTransfer = ethers.utils.parseEther("30");
            const newInstance = await contractInstance.connect(account1);
            await expect(newInstance.transferFrom(signer.address, account1.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficent allowance");
        });        

        it("TransferFrom 10 tokens from account1 to signer account", async () => {
            const signerBalanceBefore = await contractInstance.balanceOf(signer.address);
            const account1BalanceBefore = await contractInstance.balanceOf(account1.address);
            
            const amountToTransfer = ethers.utils.parseEther("10");
            const tx = await contractInstance.transferFrom(signer.address, account1.address, amountToTransfer);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }

            // Check balance
            const signerBalanceAfter = await contractInstance.balanceOf(signer.address);
            const account1BalanceAfter = await contractInstance.balanceOf(account1.address);
            expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) - parseInt(amountToTransfer));
            expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) + parseInt(amountToTransfer));

            // Check event emited
            const eventSignature = "Transfer(address,address,uint256)";
            const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                        
            // Receipt information
            const eventSignatureHashReceived = tx_result.logs[0].topics[0];
            const eventFromParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
            const eventToParametrReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
            const eventValueParametrReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

            // Check event signayure
            expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
            // Check event _from parameter
            expect(eventFromParametrReceived).to.be.equals(signer.address);
            // Check event _to parameter
            expect(eventToParametrReceived).to.be.equals(account1.address);
            // Check event _value parameter
            expect(eventValueParametrReceived).to.be.equals(amountToTransfer);
        });
    });

});