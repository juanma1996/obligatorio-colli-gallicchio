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
        const amountToStartPool = ethers.utils.parseEther("50");
        const amountToTokenVault = ethers.utils.parseEther("50");
        const amount= ethers.utils.parseEther("5");
        const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);

       const transactionCount = await signer.getTransactionCount()

            const futureAddress = getContractAddress({
                from: signer.address,
                nonce: transactionCount + 2
            })
       

        const tx = await contractInstance.approve(futureAddress, amountToStartPool);

        tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
        if(tx_result.confirmations < 0 || tx_result === undefined) {
            throw new Error("Transaction failed");
        }

        const tx3 = await contractInstance.transfer(tokenVault.address, amountToTokenVault);

        tx_result3 = await provider.waitForTransaction(tx3.hash, confirmations_number);
        if(tx_result3.confirmations < 0 || tx_result3 === undefined) {
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
        
        const tx4 = await contractInstance.transfer(account3.address, ethers.utils.parseEther("30"));

        tx_result4 = await provider.waitForTransaction(tx4.hash, confirmations_number);
        if(tx_result4.confirmations < 0 || tx_result4 === undefined) {
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
            const invariantValue =  await exchangeContractInstance.invariant() * amountOneEther;
            const balanceExchangeContract =  await provider.getBalance(exchangeContractInstance.address); 
            const balanceOfTokenVault =  await contractInstance.balanceOf(tokenVault.address);
            const feesCollected =  await exchangeContractInstance.feesCollected();
          
        //    console.log("Invariant Test: ", invariantValue);
         //  console.log("Balance Exchange Contract Test: ", balanceExchangeContract);
         //  console.log("Balance  Token Contract Test: ", balanceOfTokenVault);
         //  console.log("Fees Test: ", feesCollected);
        //   console.log("Amount Test: ", amountOneEther);
          
           const result = balanceOfTokenVault - ((invariantValue * amountOneEther) / (balanceExchangeContract - feesCollected + amountOneEther));
           
           const returnValue = await exchangeContractInstance.getExchangeRate();
           
         //console.log("Result test ", result);
         //console.log("result getExchangeRate test", returnValue);

       //    await expect(parseInt(returnValue)).to.be.equals(parseInt(result));
        });
    }); 

    describe("Test Buy Ether",  () => {
       
        /*  it("Try send Zero in amount to exchange", async () => {
            await expect(exchangeContractInstance.buyEther(0)).to.be.revertedWith("Invalid _amountToExchage value");
        });

        it("Try send without Approval to Exchange Contract", async () => {
            const amountToExchage = ethers.utils.parseEther("1");
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
            
            await expect(newInstanceExchangeContract.buyEther(amountToExchage)).to.be.revertedWith("transferFrom - Insufficent allowance");
            
        });  */

          it("Try send Buy Ethers OK", async () => {
             const amountToExchage = ethers.utils.parseEther("7");
             const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
             const newInstancecontract = await contractInstance.connect(account3);

             
         
             const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
             const balanceTokenVaultBefore = await contractInstance.balanceOf(tokenVault.address);
            // const balanceExchangeContractBefore =  await provider.getBalance(exchangeContractInstance.address); 

           //  const invariantValueBefore =  balanceExchangeContractBefore *  balanceTokenVaultBefore;

             //console.log("Invariant Before" , invariantValueBefore);
             const tx2 = await newInstancecontract.approve(exchangeContractInstance.address, ethers.utils.parseEther("7"));

             tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
             if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
                 throw new Error("Transaction failed");
             }

             const tx = await newInstanceExchangeContract.buyEther(amountToExchage);
             tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
             if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
             }

             const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
           
            const balanceTokenVaultAfter = await contractInstance.balanceOf(tokenVault.address);

            // const balanceExchangeContractAfter =  await provider.getBalance(exchangeContractInstance.address); 

          //   const invarianAfter =  balanceExchangeContractAfter *  balanceTokenVaultAfter;
        
          //   console.log( "Invariant After" ,invarianAfter);
           

             expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) - parseInt(ethers.utils.parseEther("7")));
             expect(parseInt(balanceTokenVaultAfter)).to.be.equals(parseInt(balanceTokenVaultBefore) + parseInt(ethers.utils.parseEther("7")));
          
         });
    }); 
    
     describe("Test Buy Token",  () => {
       
         it("Try send Zero in amount to Buy", async () => {
            await expect(exchangeContractInstance.buyToken(0)).to.be.revertedWith("Invalid _amountToBuy value");
        });

        it("Try send insufficient ether amount to Buy Tokens", async () => {
            const tokenToBuy = ethers.utils.parseEther("2");
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
            await expect(newInstanceExchangeContract.buyToken(tokenToBuy, {value: 0})).to.be.revertedWith("Insufficient ethers");
        });
 
        it("Try send Buy Tokens OK", async () => {
            const amountEther = ethers.utils.parseEther("300");
            const tokenToBuy = ethers.utils.parseEther("7");
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
         
            const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
            const balanceTokenVaultBefore = await contractInstance.balanceOf(tokenVault.address);

            //const invariantValueBefore = await exchangeContractInstance.invariant();
           // const balanceExchangeContractBefore =  await provider.getBalance(exchangeContractInstance.address); 
          //  console.log("Balance Exchange Before " ,balanceExchangeContractBefore);
          //  console.log("Balance Token Vault Before " ,balanceTokenVaultBefore);
         //   const invariantValueBefore =  balanceExchangeContractBefore *  balanceTokenVaultBefore;
         //   console.log("Invariant Before 1" , invariantValueBefore);

            const tx = await newInstanceExchangeContract.buyToken(tokenToBuy, {value: amountEther});
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
               throw new Error("Transaction failed");
            }

            const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
           
            const balanceTokenVaultAfter = await contractInstance.balanceOf(tokenVault.address);

           const balanceExchangeContractAfter =  await provider.getBalance(exchangeContractInstance.address); 
          //  const feesCollected =  await exchangeContractInstance.feesCollected(); 

          //const invarianAfter =  await exchangeContractInstance.getInvariant(); 

           // console.log("Balance Exchange After " ,balanceExchangeContractAfter);
           // console.log("Balance Token Vault After " ,balanceTokenVaultAfter);
           // console.log("Fees Collected " ,feesCollected);
          //  console.log("Balance Token Vault After without fees " ,(balanceExchangeContractAfter));
            const invarianAfter =  balanceExchangeContractAfter *  balanceTokenVaultAfter;

           // console.log( "Invariant After 1" ,invarianAfter);

            expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) + parseInt(ethers.utils.parseEther("7")));
            expect(parseInt(balanceTokenVaultAfter)).to.be.equals(parseInt(balanceTokenVaultBefore) - parseInt(ethers.utils.parseEther("7")));
           // expect(invariantValueBefore).to.be.equals(invarianAfter);
          
        });
    }); /*
         it("Try send Buy Tokens OK 2", async () => {
            const amountEther = ethers.utils.parseEther("30");
            const tokenToBuy = ethers.utils.parseEther("2");
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
         
            const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
            const balanceTokenVaultBefore = await contractInstance.balanceOf(tokenVault.address);

            //const invariantValueBefore = await exchangeContractInstance.invariant();
          //  const balanceExchangeContractBefore =  await provider.getBalance(exchangeContractInstance.address); 
           // console.log("Balance Exchange Before " ,balanceExchangeContractBefore);
          //  console.log("Balance Token Vault Before " ,balanceTokenVaultBefore);
          //  const invariantValueBefore =  balanceExchangeContractBefore *  balanceTokenVaultBefore;
          //  console.log("Invariant Before 1" , invariantValueBefore);

            const tx = await newInstanceExchangeContract.buyToken(tokenToBuy, {value: amountEther});
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
               throw new Error("Transaction failed");
            }

            const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
           
            const balanceTokenVaultAfter = await contractInstance.balanceOf(tokenVault.address);

           // const balanceExchangeContractAfter =  await provider.getBalance(exchangeContractInstance.address); 
          //  const feesCollected =  await exchangeContractInstance.feesCollected(); 

          //const invarianAfter =  await exchangeContractInstance.getInvariant(); 

           // console.log("Balance Exchange After " ,balanceExchangeContractAfter);
           // console.log("Balance Token Vault After " ,balanceTokenVaultAfter);
           // console.log("Fees Collected " ,feesCollected);
          //  console.log("Balance Token Vault After without fees " ,(balanceExchangeContractAfter));
          //  const invarianAfter =  (balanceExchangeContractAfter) *  balanceTokenVaultAfter;

           // console.log( "Invariant After 1" ,invarianAfter);

            expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) + parseInt(ethers.utils.parseEther("2")));
            expect(parseInt(balanceTokenVaultAfter)).to.be.equals(parseInt(balanceTokenVaultBefore) - parseInt(ethers.utils.parseEther("2")));
          
        }); 
    
        describe("Test Set Token Vault",  () => {
            it("Try send zero Address Tokens Vault", async () => {
                await expect(exchangeContractInstance.setTokenVault(zeroAddress)).to.be.revertedWith("Invalid address _tokenVault");
            });
        });  */
});