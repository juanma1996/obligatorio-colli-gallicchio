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
const { Contract } = require("hardhat/internal/hardhat-network/stack-traces/model");
chai.use(solidity);
const { expect } = chai;

const contractPath = "contracts/ERC20_Ethereum.sol:ERC20_Ethereum";
const exchangeContractPath = "contracts/Exchange.sol:Exchange";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractInstance;
let exchangeContractInstance;
// Constructor parameters
const name = "Obli_Token";
const symbol = "OTKN";



describe("Exchange tests", () => {
    before(async () => {
      
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- Exchange tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, tokenVault, account3, account4, tokenVault2, account5] = await ethers.getSigners();
        provider = ethers.provider;

        // Deploy ERC20 Ethereum
        const maxSupplyERC20Ethereum = ethers.utils.parseEther("2000000");
        const contractFactory = await ethers.getContractFactory(contractPath, signer);
        contractInstance = await contractFactory.deploy(name, symbol, maxSupplyERC20Ethereum);

        // Deploy Exchange 
        const amountTokenToStartPool = ethers.utils.parseEther("250000");
        const amountToTokenVault = ethers.utils.parseEther("250000");
        const amount= ethers.utils.parseEther("100");

        const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);
        const transactionCount = await signer.getTransactionCount()

            const futureAddress = getContractAddress({
                from: signer.address,
                nonce: transactionCount + 2
            })
       
   
        const tx = await contractInstance.approve(futureAddress, amountTokenToStartPool);
        tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
        if(tx_result.confirmations < 0 || tx_result === undefined) {
            throw new Error("Transaction failed");
        }

        const tx3 = await contractInstance.transfer(tokenVault.address, amountToTokenVault);
        tx_result3 = await provider.waitForTransaction(tx3.hash, confirmations_number);
        if(tx_result3.confirmations < 0 || tx_result3 === undefined) {
            throw new Error("Transaction failed");
        }

        exchangeContractInstance = await exchangeContractFactory.deploy(tokenVault.address, contractInstance.address, amountTokenToStartPool, { value: amount });
        if(exchangeContractInstance.confirmations < 0 || exchangeContractInstance === undefined) {
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

        it("Try send insufficient balance in Vault", async () => {
            const amount= ethers.utils.parseEther("100");
            const exchangeContractFactory = await ethers.getContractFactory(exchangeContractPath, signer);
            await expect(exchangeContractFactory.deploy(tokenVault2.address, contractInstance.address, amount)).to.be.revertedWith("Insufficient tokens in the vault");
       });
    });

    describe("Test GetExchangeRate",  () => {

        it("Try Get Exchange Rate", async () => {
            const amountOneEther = ethers.utils.parseEther("1");
            const invariant =  await exchangeContractInstance.invariant();
            const invariantValue = invariant.mul(amountOneEther);
            const balanceExchangeContract =  await provider.getBalance(exchangeContractInstance.address); 
            const balanceOfTokenVault =  await contractInstance.balanceOf(tokenVault.address);
            const feesCollected =  await exchangeContractInstance.feesCollected();

           const result = balanceOfTokenVault.sub(invariantValue.div(balanceExchangeContract.sub(feesCollected).add(amountOneEther)));
           
           const returnValue = await exchangeContractInstance.getExchangeRate();
        
           await expect(parseInt(returnValue)).to.be.equals(parseInt(result));
        });
    }); 

    describe("Test Buy Ether",  () => {
       
         it("Try send Zero in amount to exchange", async () => {
            await expect(exchangeContractInstance.buyEther(0)).to.be.revertedWith("Invalid _amountToExchange value");
        });

        it("Try send without Approval to Exchange Contract", async () => {
            const amountToExchage = ethers.utils.parseEther("1");
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
            
            await expect(newInstanceExchangeContract.buyEther(amountToExchage)).to.be.revertedWith("transferFrom - Insufficent allowance");
            
        });  

          it("Try send Buy Ethers OK", async () => {
             const amountToExchage = ethers.utils.parseEther("7");
             const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
             const newInstancecontract = await contractInstance.connect(account3);

            
             const account3BalanceBefore = await contractInstance.balanceOf(account3.address);
             const balanceTokenVaultBefore = await contractInstance.balanceOf(tokenVault.address);
             const balanceExchangeContractBefore =  await provider.getBalance(exchangeContractInstance.address); 
           //  const balanceAccount3Before =  await provider.getBalance(account3.address); 

             const feesCollectedBefore = await exchangeContractInstance.feesCollected();
             const invariantBefore = balanceExchangeContractBefore.sub(feesCollectedBefore).mul(balanceTokenVaultBefore);

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
             const balanceExchangeContractAfter =  await provider.getBalance(exchangeContractInstance.address); 
            // const balanceAccount3After =  await provider.getBalance(account3.address); 
             const feesCollectedAfter = await exchangeContractInstance.feesCollected();
             const invariantAfter = balanceExchangeContractAfter.sub(feesCollectedAfter).mul(balanceTokenVaultAfter);

            //console.log("INVARIANT BEFORE BUY ETHERS", invariantBefore);
           // console.log("INVARIANT AFTER BUY ETHERS", invariantAfter);

            // expect(balanceAccount3Before.add(balanceExchangeContractBefore.sub(balanceExchangeContractAfter.sub(feesCollectedAfter)))).to.bo.equals(balanceAccount3After);
             expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) - parseInt(ethers.utils.parseEther("7")));
             expect(parseInt(balanceTokenVaultAfter)).to.be.equals(parseInt(balanceTokenVaultBefore) + parseInt(ethers.utils.parseEther("7")));
            // expect(invariantBefore).to.be.equals(invariantAfter);
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
            const balanceExchangeContractBefore =  await provider.getBalance(exchangeContractInstance.address); 
            const feesCollectedBefore = await exchangeContractInstance.feesCollected();
            const invariantBefore = balanceExchangeContractBefore.sub(feesCollectedBefore).mul(balanceTokenVaultBefore);

            // Token Vault aprueba que Exchange Contract maneje los Tokens
            const newInstanceTokenContract = await contractInstance.connect(tokenVault);
            const tx2 = await newInstanceTokenContract.approve(exchangeContractInstance.address, tokenToBuy);

            tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
            if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
                throw new Error("Transaction failed");
            }

            const tx = await newInstanceExchangeContract.buyToken(tokenToBuy, {value: amountEther});
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
               throw new Error("Transaction failed");
            }

            const account3BalanceAfter = await contractInstance.balanceOf(account3.address);
            const balanceTokenVaultAfter = await contractInstance.balanceOf(tokenVault.address);
            const balanceExchangeContractAfter =  await provider.getBalance(exchangeContractInstance.address); 
            const feesCollectedAfter = await exchangeContractInstance.feesCollected();
            const invariantAfter = balanceExchangeContractAfter.sub(feesCollectedAfter).mul(balanceTokenVaultAfter);

            //console.log("INVARIANT BEFORE BUY TOKENS", invariantBefore);
            //console.log("INVARIANT AFTER BUY TOKENS", invariantAfter);
            expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) + parseInt(ethers.utils.parseEther("7")));
            expect(parseInt(balanceTokenVaultAfter)).to.be.equals(parseInt(balanceTokenVaultBefore) - parseInt(ethers.utils.parseEther("7")));
           // expect(invariantBefore).to.be.equals(invariantAfter);
          
        });
    });

    describe("Set Token Vault Test",  () => {
        it("Try send zero Address Token Vault", async () => {
            await expect(exchangeContractInstance.setTokenVault(zeroAddress)).to.be.revertedWith("Invalid address _tokenVault");
        }); 

        it("Try send zero Address Contract how Token Vault", async () => {
             await expect(exchangeContractInstance.setTokenVault(contractInstance.address)).to.be.revertedWith("_tokenVault cannot be a contract");
        }); 

        it("Try set Token Vault Address with zero balance", async () => {
            await expect(exchangeContractInstance.setTokenVault(account4.address)).to.be.revertedWith("_tokenVault has no balance");
        }); 

        it("Try set Token Vault Address with not authorization to Exchange Contract for operate balance", async () => {
            const tokenAmount = ethers.utils.parseEther("1");
            const tx = await contractInstance.transfer(account4.address, tokenAmount);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                   throw new Error("Transaction failed");
            }
            await expect(exchangeContractInstance.setTokenVault(account4.address)).to.be.revertedWith("Invalid tokenVault address");
        }); 

        it("Try set Token Vault Address with not owner", async () => {
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
            await expect(newInstanceExchangeContract.setTokenVault(account4.address)).to.be.revertedWith("Not authorized");
        }); 

        it("Try set Token Vault OK", async () => {
            //const amountToTokenVault = await contractInstance.balanceOf(tokenVault.address);
            const amountToTokenVault = ethers.utils.parseEther("800000");
            const tx = await contractInstance.transfer(tokenVault2.address, amountToTokenVault);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                   throw new Error("Transaction failed");
            }

            const newContractInstance = await contractInstance.connect(tokenVault2);
            const tx2 = await newContractInstance.approve(exchangeContractInstance.address, amountToTokenVault);
            tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
            if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
                   throw new Error("Transaction failed");
            }

           
            const tx3 =  await exchangeContractInstance.setTokenVault(tokenVault2.address);
            tx_result3 = await provider.waitForTransaction(tx3.hash, confirmations_number);
            if(tx_result3.confirmations < 0 || tx_result3 === undefined) {
                throw new Error("Transaction failed");
            }

            const tokenAmount = await contractInstance.balanceOf(tokenVault2.address);
            const etherContract = await provider.getBalance(exchangeContractInstance.address);
            const invariant = await exchangeContractInstance.invariant();
            const feesCollected = await exchangeContractInstance.feesCollected();
            expect( (tokenAmount.mul(etherContract.sub(feesCollected))).div(ethers.utils.parseEther("1")) ).to.be.equals(invariant);
        }); 
    });

    describe("Deposit Test",  () => {
        it("Try Deposit with not owner", async () => {
            const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
            await expect(newInstanceExchangeContract.deposit({value:1})).to.be.revertedWith("Not authorized");
        }); 

        it("Try Deposit send zero ethers", async () => {
            const amountEther = ethers.utils.parseEther("1");
            await expect(exchangeContractInstance.deposit({value:0})).to.be.revertedWith("No ethers deposited");
         }); 

        it("Try Deposit with not authorization to Exchange Contract for operate balance", async () => {
            const amountEther = ethers.utils.parseEther("1");
            await expect(exchangeContractInstance.deposit({value:amountEther})).to.be.revertedWith("transferFrom - Insufficent allowance");
         }); 

        it("Try Deposit with insufficient balance", async () => {
            const totalTokenSigner = await contractInstance.balanceOf(signer.address);
            const totalTokenVault = await contractInstance.balanceOf(exchangeContractInstance.tokenVault());
            const oneToken = ethers.utils.parseEther("1");
            const newTokenToDeposit = totalTokenSigner.add(oneToken);
            const etherValueNeeded = await exchangeContractInstance.calculateEtherAmount(newTokenToDeposit);
            await expect(exchangeContractInstance.deposit({value:etherValueNeeded})).to.be.revertedWith("Insufficient balance");
        });  

        it("Try Deposit Ok", async () => {
          
            const amountEther = ethers.utils.parseEther("1")
            const amountTokensNeeded = await exchangeContractInstance.getExchangeRate();
   
            const balanceTokensSignerBefore = await contractInstance.balanceOf(signer.address);
            const balanceTokensVaultBefore = await contractInstance.balanceOf(tokenVault2.address);

            const balanceEthersExchangeContractBefore = await provider.getBalance(exchangeContractInstance.address);
            const balanceEthersSignerBefore = await provider.getBalance(signer.address);
            
            const tx = await contractInstance.approve(exchangeContractInstance.address, amountTokensNeeded);
            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }
           // console.log("PRECIO TRAN", tx_result.gasUsed.mul(tx_result.effectiveGasPrice));

            const tx2 = await exchangeContractInstance.deposit({value:amountEther});
            tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
            if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
                throw new Error("Transaction failed");
            }
            //console.log(tx_result2.gasUsed.mul(tx_result2.effectiveGasPrice));
            //const effGasPrice = tx2.effectiveGasPrice;
            //const txGasUsed = tx2.gasUsed;
           // const gasUsedETH = effGasPrice * txGasUsed;

           const balanceTokensSignerAfter = await contractInstance.balanceOf(signer.address);
           const balanceTokensVaultAfter = await contractInstance.balanceOf(tokenVault2.address);

            const balanceEthersExchangeContractAfter = await provider.getBalance(exchangeContractInstance.address);
            const balanceEthersSignerAfter = await provider.getBalance(signer.address);
               
            expect(balanceEthersSignerAfter).to.be.equals(balanceEthersSignerBefore.sub(amountEther).sub(tx_result.gasUsed.mul(tx_result.effectiveGasPrice).add(tx_result2.gasUsed.mul(tx_result2.effectiveGasPrice))));
            //console.log("DIFERENCIA:", balanceEthersSignerBefore.sub(amountEther).sub(balanceEthersSignerAfter));
            //console.log("PRECIO TRAN2", tx_result2.gasUsed.mul(tx_result2.effectiveGasPrice));
            //console.log("TOTAL COBRADO", tx_result.gasUsed.mul(tx_result.effectiveGasPrice).add(tx_result2.gasUsed.mul(tx_result2.effectiveGasPrice)) )
            expect(balanceEthersExchangeContractAfter).to.be.equals(balanceEthersExchangeContractBefore.add(amountEther));
        
            expect(parseInt(balanceTokensSignerAfter)).to.be.lessThanOrEqual(parseInt(balanceTokensSignerBefore));
            expect(parseInt(balanceTokensVaultAfter)).to.be.greaterThanOrEqual(parseInt(balanceTokensVaultBefore));
            expect(balanceTokensSignerBefore.add(balanceTokensVaultBefore)).to.be.equals(balanceTokensSignerAfter.add(balanceTokensVaultAfter));
            //expect(parseInt(balanceExchangeContractAfter.add(balanceSignerAfter))).to.be.equals(parseInt(balanceExchangeContractBefore.add(balanceSignerBefore)));
                
            }); 
        }); 

        describe("Set Fee Percentage tests", () => {
            it("Try send zero value to set FEE", async () => {
                await expect(exchangeContractInstance.setFeePercentage(0)).to.be.revertedWith("Invalid _feePercentage value");
            }); 

            it("Try send not owner to set fee", async () => {
                const newInstanceExchangeContract = await exchangeContractInstance.connect(account3);
                await expect(newInstanceExchangeContract.setFeePercentage(2)).to.be.revertedWith("Not authorized");
            }); 

            it("Try Set FEE Percentage OK", async () => {
                const newFEE = ethers.utils.parseEther("1");

                const tx = await exchangeContractInstance.setFeePercentage(newFEE);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }
                
                const feeSET = await exchangeContractInstance.feePercentage();
                expect(feeSET).to.be.equals(newFEE);
            }); 
        });

        describe("Withdraw Fees Amount tests", () => {
            it("Try Withdraw Fees with not authorization account", async () => {
                const newInstanceExchangeContract = await exchangeContractInstance.connect(account4);
                await expect(newInstanceExchangeContract.withdrawFeesAmount()).to.be.revertedWith("Not authorized");
            }); 

            it("Try Withdraw Fees with insufficient amount", async () => {
                await expect(exchangeContractInstance.withdrawFeesAmount()).to.be.revertedWith("Insufficient amount of fees");
            }); 

            it("Try Withdraw Fees OK", async () => {
                const tokenAmount = await contractInstance.balanceOf(signer.address);
                const newFEE = ethers.utils.parseEther("2");
            
                const tx4 = await exchangeContractInstance.setFeePercentage(newFEE);
                tx_result4 = await provider.waitForTransaction(tx4.hash, confirmations_number);
                if(tx_result4.confirmations < 0 || tx_result4 === undefined) {
                    throw new Error("Transaction failed");
                }

                const tx = await contractInstance.transfer(account5.address, tokenAmount.sub(ethers.utils.parseEther("200000")));
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const newInstanceContract = await contractInstance.connect(account5);
                const tx3 = await newInstanceContract.approve(exchangeContractInstance.address, ethers.utils.parseEther("200000"));
                tx_result3 = await provider.waitForTransaction(tx3.hash, confirmations_number);
                if(tx_result3.confirmations < 0 || tx_result3 === undefined) {
                    throw new Error("Transaction failed");
                }

                const newInstanceExchangeContract = await exchangeContractInstance.connect(account5);
                const tx2 = await newInstanceExchangeContract.buyEther(ethers.utils.parseEther("200000"));
                tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
                if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
                    throw new Error("Transaction failed");
                } 

                const balanceEthersExchangeContractBefore = await provider.getBalance(exchangeContractInstance.address);
                const feesCollectedBefore = await exchangeContractInstance.feesCollected();

                const tx5 = await exchangeContractInstance.withdrawFeesAmount();
                tx_result5 = await provider.waitForTransaction(tx5.hash, confirmations_number);
                if(tx_result5.confirmations < 0 || tx_result5 === undefined) {
                    throw new Error("Transaction failed");
                } 

                const balanceEthersExchangeContractAfter = await provider.getBalance(exchangeContractInstance.address);
                const feesCollectedAfter = await exchangeContractInstance.feesCollected();

                expect(feesCollectedAfter).to.be.equals(0);
                expect(balanceEthersExchangeContractBefore.sub(feesCollectedBefore)).to.be.equals(balanceEthersExchangeContractAfter);
            }); 
        });

        describe("Calculate Ether Amount", () => {
            it("Try Send zero  value in _tokenAmount", async () => {
                await expect(exchangeContractInstance.calculateEtherAmount(0)).to.be.revertedWith("Invalid _tokenAmount value");
            }); 

            it("Calculate Ether Amount OK", async () => {
                const tokenAmount = ethers.utils.parseEther("2");
                await exchangeContractInstance.calculateEtherAmount(tokenAmount);
            }); 
        });

});