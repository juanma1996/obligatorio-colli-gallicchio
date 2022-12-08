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
const exchangeContractPath = "contracts/ExchangeContract.sol:ExchangeContract";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractInstance;
let exchangeContractInstance;
// Constructor parameters
const name = "Obli_Token";
const symbol = "OTKN";



describe("Exchange Contract tests", () => {
    before(async () => {
      
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- Exchange Contract tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, tokenVault, account3] = await ethers.getSigners();
        provider = ethers.provider;

        // Deploy Token Contract
        const contractFactory = await ethers.getContractFactory(contractPath, signer);
        contractInstance = await contractFactory.deploy(name, symbol);

        // Deploy Exchange Contract
        const amountToStartPool = ethers.utils.parseEther("2000");
        const amount= ethers.utils.parseEther("1500");
        const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);

       const transactionCount = await signer.getTransactionCount()

            const futureAddress = getContractAddress({
                from: signer.address,
                nonce: transactionCount + 1
            })
       

        const tx = await contractInstance.approve(futureAddress, amountToStartPool);

        tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
        if(tx_result.confirmations < 0 || tx_result === undefined) {
            throw new Error("Transaction failed");
        }
        
        exchangeContractInstance = await exchangeContractFactory.deploy(tokenVault.address, contractInstance.address, amountToStartPool, { value: amount });
        if(exchangeContractInstance.confirmations < 0 || exchangeContractInstance === undefined) {
            throw new Error("Transaction failed");
        }

        // Token Vault aprueba que Exchange Contract maneje los Tokens
        const newInstanceTokenContract = await contractInstance.connect(tokenVault);
        const tx2 = await newInstanceTokenContract.approve(exchangeContractInstance.address, amountToStartPool);

        tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
        if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
            throw new Error("Transaction failed");
        }
        
    });

    describe("Constructor tests", () => {
        it("Try send zero address in Token Vault value", async () => {
            const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);
            await expect(exchangeContractFactory.deploy(zeroAddress, contractInstance.address, 0)).to.be.revertedWith("Invalid address _tokenVault");
        });

        it("Try send address Contract in Vault Token address value", async () => {
             const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);
            await expect(exchangeContractFactory.deploy(contractInstance.address, zeroAddress, 0)).to.be.revertedWith("_tokenVault cannot be a contract");
        });

        it("Try send zero address in ERC20 address value", async () => {
            const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);
             await expect(exchangeContractFactory.deploy(account1.address, zeroAddress, 0)).to.be.revertedWith("_erc20Contract cannot be zero address");
        });

        it("Try send ERC20 address with not Contract address value", async () => {
            const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);
             await expect(exchangeContractFactory.deploy(account1.address, tokenVault.address, 0)).to.be.revertedWith("_erc20Contract is not a contract");
        });

        it("Try send zero value in token Amount", async () => {
             const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);
             await expect(exchangeContractFactory.deploy(account1.address, contractInstance.address, 0)).to.be.revertedWith("Invalid _tokenAmount value");
        });
    });

    describe("Test GetExchangeRate",  () => {

        it("Try Get Exchange Rate", async () => {
            const amountOneEther = ethers.utils.parseEther("1");
            const invariantValue =  await exchangeContractInstance.invariant();
            const balanceExchangeContract =  await provider.getBalance(exchangeContractInstance.address); 
            const balanceOfTokenVault =  await contractInstance.balanceOf(tokenVault.address);
            const result = parseInt(balanceOfTokenVault) - (parseInt(invariantValue) / (parseInt(balanceExchangeContract) + parseInt(amountOneEther)));
           
           const returnValue = await exchangeContractInstance.getExchangeRate();
           await expect(parseInt(returnValue)).to.be.greaterThan(result);
        });
    });

    describe("Test Buy Token",  () => {
       
        it("Try send Zero in amount to Buy", async () => {
            await expect(exchangeContractInstance.buyToken(0)).to.be.revertedWith("Invalid _amountToBuy value");
        });

        it("Try send insufficient ether amount to Buy Tokens", async () => {
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
            await expect(newInstanceExchangeContract.buyToken(2, {value: 0})).to.be.revertedWith("Insufficient ethers");
        });

        it("Try send Buy Tokens OK", async () => {
            const amountEther = ethers.utils.parseEther("106");
            const tokenToBuy = 60;
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
         
            const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
            const balanceTokenVaultBefore = await contractInstance.balanceOf(tokenVault.address);

            //const invariantValueBefore = await exchangeContractInstance.invariant();
            const balanceExchangeContractBefore =  await provider.getBalance(exchangeContractInstance.address); 

            const invariantValueBefore =  balanceExchangeContractBefore *  balanceTokenVaultBefore;
            console.log("Invariant Before 1" , invariantValueBefore);

            const tx = await newInstanceExchangeContract.buyToken(tokenToBuy, {value: amountEther});
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
               throw new Error("Transaction failed");
            }

            const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
           
            const balanceTokenVaultAfter = await contractInstance.balanceOf(tokenVault.address);

            const balanceExchangeContractAfter =  await provider.getBalance(exchangeContractInstance.address); 

            const invarianAfter =  balanceExchangeContractAfter *  balanceTokenVaultAfter;

            console.log( "Invariant After 1" ,invarianAfter);

            expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) + parseInt(ethers.utils.parseEther("60")));
            expect(parseInt(balanceTokenVaultAfter)).to.be.equals(parseInt(balanceTokenVaultBefore) - parseInt(ethers.utils.parseEther("60")));
          
        });
    });


    describe("Test Buy Ether",  () => {
       
        it("Try send Zero in amount to exchange", async () => {
            await expect(exchangeContractInstance.buyEther(0)).to.be.revertedWith("Invalid _amountToExchage value");
        });

        it("Try send insufficient tokens amount to buy Ethers", async () => {
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
            await expect(newInstanceExchangeContract.buyEther(100, {value: 0})).to.be.revertedWith("Insufficient balance");
        });

        // it("Try send Buy Tokens OK", async () => {
        //     const amountToExchage = 20;
        //     const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
        //     const newInstancecontract = await contractInstance.connect(account3);
         
        //     const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
        //     const balanceTokenVaultBefore = await contractInstance.balanceOf(tokenVault.address);
        //     const balanceExchangeContractBefore =  await provider.getBalance(exchangeContractInstance.address); 

        //     const invariantValueBefore =  balanceExchangeContractBefore *  balanceTokenVaultBefore;

        //     console.log("Invariant Before" , invariantValueBefore);
        //     const tx2 = await newInstancecontract.approve(exchangeContractInstance.address, ethers.utils.parseEther("20"));

        //     tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
        //     if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
        //         throw new Error("Transaction failed");
        //     }

        //     //console.log( parseInt(invariantValueBefore));
        //     const tx = await newInstanceExchangeContract.buyEther(amountToExchage);
        //     tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
        //     if(tx_result.confirmations < 0 || tx_result === undefined) {
        //        throw new Error("Transaction failed");
        //     }

        //     const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
           
        //     const balanceTokenVaultAfter = await contractInstance.balanceOf(tokenVault.address);

        //     const balanceExchangeContractAfter =  await provider.getBalance(exchangeContractInstance.address); 

        //     const invarianAfter =  balanceExchangeContractAfter *  balanceTokenVaultAfter;
        
        //     console.log( "Invariant After" ,invarianAfter);
           

        //     expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) - parseInt(ethers.utils.parseEther("20")));
        //     expect(parseInt(balanceTokenVaultAfter)).to.be.equals(parseInt(balanceTokenVaultBefore) + parseInt(ethers.utils.parseEther("20")));
          
        // });
    });
});