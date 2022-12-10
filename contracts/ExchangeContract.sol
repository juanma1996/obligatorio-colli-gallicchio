// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/ITokenContract.sol";
import "hardhat/console.sol";
contract ExchangeContract {

    /// STATE VARIABLES
    address public tokenVault;
    address public erc20Contract;
    uint8 public decimalsToken;
    uint256 public feePercentage;
    address public owner;
    uint256 public invariant;
    uint256 public feesCollected;

    /*
     * @notice Initialize the state of the contract
     * @dev Throw if `_tokenVault` is zero address. Message: "Invalid address _tokenVault"
     * @dev Throw if `_tokenVault` is a smart contract. Message: "_tokenVault cannot be a contract"
     * @dev Throw if `_erc20Contract` is zero address. Message: "Invalid address _erc20Contract"
     * @dev Throw if `_erc20Contract` is not a smart contract. Message: "_erc20Contract is not a contract"
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     */
    constructor(address _tokenVault, address _erc20Contract , uint256 _tokenAmount) payable
    {
         // Checks
        _isZeroAddress(_tokenVault, '_tokenVault');
        if (_isSmartContractAddress(_tokenVault) == true){
            revert("_tokenVault cannot be a contract");
        }
        if (_erc20Contract == address(0)) {
            revert("_erc20Contract cannot be zero address");
        }
        if (_isSmartContractAddress(_erc20Contract) == false){
            revert("_erc20Contract is not a contract");
        }
        if (_tokenAmount == 0) {
            revert("Invalid _tokenAmount value");
        }
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(_tokenVault, _erc20Contract);
       
        if(tokenAmountOfTokenVault < _tokenAmount)
        {
           revert("Insufficient tokens in the vault");
        }

        uint256 tokenVaultAmount = balanceOfTokenContract(_tokenVault, _erc20Contract);
        if (tokenVaultAmount < _tokenAmount){
            revert("Insufficient tokens in the vault");
        }
      
        transferFromTokenContract(msg.sender, _tokenVault, _tokenAmount, _erc20Contract);
       
        // Effects
        decimalsToken = 18;
        feePercentage = 3 * (10 ** uint256(15));
        owner = msg.sender;
        tokenVault = _tokenVault;
        erc20Contract = _erc20Contract;
        invariant = (msg.value * (_tokenAmount + tokenVaultAmount)) / _getUnitDecimals();
    }

    function getExchangeRate() external view returns (uint256)
    {
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Contract);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected + (1 ether)))); 
       
       // console.log("Result getExchangeRate", result);
        return result;
    }

    function calculateTokensPerEthers(uint256 _ethersOfTransaction) private view returns(uint256)
    {
        
         uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Contract);
        
        uint256 balanceOfContract = address(this).balance; 
        
      //   console.log("Invariant Solidity: ", (invariant * _getUnitDecimals()));
       //    console.log("Balance Exchange Contract Solidity: ", balanceOfContract);
       //    console.log("Balance  Token Contract Solidity: ", tokenAmountOfTokenVault);
       //    console.log("Fees Solidity: ", feesCollected);
      //     console.log("Amount Solidity: ", etherAmount);


        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected + _ethersOfTransaction))); 
       
        //console.log("Result calculateTokensPerEthers", result);
        return result;
    }

     function calculateEthersToSellTokens(uint256 _tokenAmount) private view returns(uint256)
    {
        
         uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Contract);
        
       // uint256 tokenAmountToExchange = _convertValueWithDecimals(_tokenAmount);
        
        uint256 balanceOfContract = address(this).balance; 
        
        //  uint256 fiveUnit = _convertValueWithDecimals(5);
        //  console.log("Balance of Contract without Fees", balanceOfContract - _ethersOfTransaction - feesCollected);
        //  console.log("Eterhs of transaction", _ethersOfTransaction);
        //   console.log("Invariant", invariant);
        //  console.log("Token Of Token Vault", tokenAmountOfTokenVault);
        //   console.log("Token To Exchange", tokenAmountToExchange);

        //     uint256 suma = tokenAmountOfTokenVault + tokenAmountToExchange;
        //  console.log("Suma", suma);
        //  uint256 div = invariant / suma;
        //console.log("Division: ", div );
            //  console.log("Resta2" , balanceOfContract - _ethersOfTransaction);
            //   console.log("Fees Collected", feesCollected);
        uint256 result =   (balanceOfContract - feesCollected)  - ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault + _tokenAmount) ); 
       
      // console.log("Result calculateEthersToSellTokens", result);
        return result;
    }

    function calculateEthersToBuyTokens(uint256 _tokenAmount, uint256 _ethersOfTransaction) private view returns(uint256)
    {
        
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Contract);
        
        //uint256 tokenAmountToExchange = _convertValueWithDecimals(_tokenAmount);
        
        uint256 balanceOfContract = address(this).balance; 
        
        
        //console.log("Balance of Contract without Fees", balanceOfContract - _ethersOfTransaction - feesCollected);
        //console.log("Eterhs of transaction", _ethersOfTransaction);
        //console.log("Invariant", invariant);
       // console.log("Token Of Token Vault", tokenAmountOfTokenVault);
       // console.log("Token To Exchange", tokenAmountToExchange);
        //console.log("Resta", tokenAmountOfTokenVault - tokenAmountToExchange);
        //console.log("Resta2" , balanceOfContract - _ethersOfTransaction);
       // console.log("Fees Collected", feesCollected);
        uint256 result =  ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault - _tokenAmount) ) - (balanceOfContract - _ethersOfTransaction - feesCollected); 
       
       // console.log("Result", result);
        return result;
    }

  /*   function getInvariant() external view returns(uint256)
    {
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Contract);
        uint256 balanceOfContract = address(this).balance; 

        console.log("Balance of Contract 2 ", balanceOfContract);
        console.log("Token Of Token Vault 2 ", tokenAmountOfTokenVault);

        uint256 result = tokenAmountOfTokenVault * balanceOfContract;
        console.log("Result ", result);

        return result;

    } */

    function buyToken(uint256 _amountTokenToBuy) external payable{
        if (_amountTokenToBuy == 0) {
           revert("Invalid _amountToBuy value");
        }
   
        uint256 etherAmountToCollect = calculateEthersToBuyTokens(_amountTokenToBuy, msg.value) ;
        uint256 feeToCharge = (etherAmountToCollect * feePercentage) / _convertValueWithDecimals(100);
        etherAmountToCollect += feeToCharge;
        //console.log("Fees to charge ", feeToCharge);
        feesCollected += feeToCharge;
        if (msg.value < etherAmountToCollect){
             revert("Insufficient ethers");
        }

        transferFromTokenContract(tokenVault, msg.sender, _amountTokenToBuy, erc20Contract);

        if (msg.value > etherAmountToCollect)
        {
            payable(msg.sender).transfer(msg.value - etherAmountToCollect);
        }  
       // console.log("Fees Collected final ", feesCollected);
       //  console.log("Balance Final With Fees", address(this).balance);

       uint256 tokenAmountOfTokenVault2 = balanceOfTokenContract(tokenVault, erc20Contract);
     //   console.log("Balance Token Vault Final ", tokenAmountOfTokenVault2);
      //    console.log("Balance Final Without Fees ", address(this).balance - feesCollected);
          
          console.log("Invariant Buy Token", (((address(this).balance - feesCollected) * tokenAmountOfTokenVault2) / 1 ether));
    }

    function buyEther(uint256 _amountTokenToExchage) external{
        if (_amountTokenToExchage == 0) 
        {
           revert("Invalid _amountToExchage value");
        }
        
        //uint256 tokenAmountToExchange = _convertValueWithDecimals(_amountTokenToExchage);
         _isInsuffientBalance(msg.sender, _amountTokenToExchage);
       
        uint256 etherAmountToPay = calculateEthersToSellTokens(_amountTokenToExchage) ;
      
        uint256 feeToCharge = (etherAmountToPay * feePercentage) / 1 ether; //_convertValueWithDecimals(1);
        etherAmountToPay -= feeToCharge;
        
        if((address(this).balance - feesCollected)  < etherAmountToPay)
        {
            revert("Insufficient balance");
        }
        feesCollected += feeToCharge;
        transferFromTokenContract(msg.sender, tokenVault, _amountTokenToExchage, erc20Contract);
        
        payable(msg.sender).transfer(etherAmountToPay);

        uint256 tokenAmountOfTokenVault2 = balanceOfTokenContract(tokenVault, erc20Contract);
       // console.log("Balance Token Vault Final ", tokenAmountOfTokenVault2);
       // console.log("Balance Final Without Fees ", address(this).balance - feesCollected);
       //  console.log("Balance Final With Fees ", address(this).balance);
       //  console.log("Fees ", feesCollected);

        console.log("Invariant Buy Ether ", (((address(this).balance - feesCollected) * tokenAmountOfTokenVault2) / 1 ether));
    }

    function setFeePercentage(uint256 _feePercentage) external{
         if (_feePercentage == 0) 
        {
           revert("Invalid _feePercentage value");
        }
         _isOwnerProtocol(msg.sender);

         feePercentage = _feePercentage;
    }

    function deposit() external payable
    {
         _isOwnerProtocol(msg.sender);
      
         uint256 amountToExchange = calculateTokensPerEthers(msg.value);
         //console.log(amountToExchange);
         _isInsuffientBalance(msg.sender, amountToExchange);
        
        // uint256 balance1 = balanceOfTokenContract(msg.sender, erc20Contract);
        //  uint256 balance2 = balanceOfTokenContract(tokenVault, erc20Contract);

        //  console.log("BALANCE SIGNER", balance1);
        //  console.log("BALANCE TOKEN CONTRACT", balance2);
         transferFromTokenContract(msg.sender, tokenVault, amountToExchange, erc20Contract);

        //  balance1 = balanceOfTokenContract(msg.sender, erc20Contract);
        //   balance2 = balanceOfTokenContract(tokenVault, erc20Contract);

       //   console.log("BALANCE SIGNER AFTER", balance1);
       //   console.log("BALANCE TOKEN CONTRACT AFTER", balance2);
    }

    function withdrawFeesAmount() external
    {
        _isOwnerProtocol(msg.sender);
        uint256 minFees = 5 * (10 ** uint256(16));
        if(feesCollected < minFees)
        {
             revert("Insufficient amount of fees");
        }

        payable(msg.sender).transfer(feesCollected);
    }

    function setTokenVault(address _tokenVault) external{
         if (_tokenVault == address(0)) {
           revert("Invalid address _tokenVault");
        }
        if (_isSmartContractAddress(_tokenVault) == true){
            revert("_tokenVault cannot be a contract");
        }
        _isOwnerProtocol(msg.sender);
        uint256 tokenVaultBalance = balanceOfTokenContract(_tokenVault, erc20Contract);
        if(tokenVaultBalance == 0)
        {
            revert("_tokenVault has no balance");
        }
        uint256 result = allowanceTokenContract(_tokenVault, address(this), erc20Contract);
        if (result <= 0){
            revert("Invalid tokenVault address");
        }
        
        //TODO: chequear si hay que hacer más acciones con el invariant
        tokenVault = _tokenVault;
    }

    // /// ------------------------------------------------------------------------------------------------------------------------------------------
    // /// PRIVATE FUNCTIONS
    // /// ------------------------------------------------------------------------------------------------------------------------------------------

    function _getUnitDecimals() private view returns(uint256)
    {
        return _convertValueWithDecimals(1);
    }

    function _isOwnerProtocol(address _address) private view {
         if (owner != _address) {
             revert("Not authorized");
         }
     }
    
    function _isZeroAddress(address _address, string memory _parameterName) internal virtual pure {
         if (_address == address(0)) {
             string memory _message = string.concat("Invalid address ", _parameterName);
            revert(_message);
        }
    }

     function _isSmartContractAddress(address _address) private view returns (bool) {
         bytes32 zeroAccountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
         bytes32 codeHash;    
         assembly { codeHash := extcodehash(_address) }
         return (codeHash != zeroAccountHash && codeHash != 0x0);
     }

    function _isInsuffientBalance(address _address, uint256 _amountToExchage) internal virtual view 
    {
        uint256 senderTokenAmount = balanceOfTokenContract(_address, erc20Contract);
        if (senderTokenAmount < _amountToExchage)
        {
             revert("Insufficient balance");
        }
    }

    function _convertValueWithDecimals(uint256 value) private view returns(uint256)
    {
        uint256 result = value * (10 ** decimalsToken);

        return result;
    }

    function transferFromTokenContract(address _from, address _to, uint256 _value, address _erc20Conctract) private  {
            ITokenContract(_erc20Conctract).transferFrom(_from, _to,_value);
    }

    function balanceOfTokenContract(address _from, address _erc20Conctract) private  view returns (uint256) {
            return ITokenContract(_erc20Conctract).balanceOf(_from);
    }

    function transferTokenContract(address _to, uint256 _value, address _erc20Conctract) private  {
            ITokenContract(_erc20Conctract).transfer(_to,_value);
    }

     function allowanceTokenContract(address _owner, address _spender, address _erc20Conctract) private view returns (uint256)  {
            return ITokenContract(_erc20Conctract).allowance(_owner, _spender);
    }
}