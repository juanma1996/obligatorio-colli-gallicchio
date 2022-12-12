// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/ITokenContract.sol";
import "hardhat/console.sol";
contract Exchange {

    /// STATE VARIABLES
    address public tokenVault;
    address public erc20Ethereum;
    uint256 public decimalsToken;
    address public owner;
    uint256 public feePercentage;
    uint256 public feesCollected;
    uint256 public invariant;
  

    /*
     * @notice Initialize the state of the contract
     * @dev Throw if `_tokenVault` is zero address. Message: "Invalid address _tokenVault"
     * @dev Throw if `_tokenVault` is a smart contract. Message: "_tokenVault cannot be a contract"
     * @dev Throw if `_erc20Contract` is zero address. Message: "Invalid address _erc20Contract"
     * @dev Throw if `_erc20Contract` is not a smart contract. Message: "_erc20Contract is not a contract"
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     */
    constructor(address _tokenVault, address _erc20Ethereum , uint256 _tokenAmount) payable
    {
         // Checks
        _isZeroAddress(_tokenVault, '_tokenVault');
        if (_isSmartContractAddress(_tokenVault) == true){
            revert("_tokenVault cannot be a contract");
        }
        if (_erc20Ethereum == address(0)) {
            revert("_erc20Contract cannot be zero address");
        }
        if (_isSmartContractAddress(_erc20Ethereum) == false){
            revert("_erc20Contract is not a contract");
        }
        if (_tokenAmount == 0) {
            revert("Invalid _tokenAmount value");
        }
        
        _isInsuffientBalance(msg.sender, _tokenAmount,_erc20Ethereum);
        uint256 tokenVaultAmount = balanceOfTokenContract(_tokenVault, _erc20Ethereum);
        if (tokenVaultAmount < _tokenAmount){
            revert("Insufficient tokens in the vault");
        }
 
        // Effects
        decimalsToken = 18;
        feePercentage = 3 * (10 ** uint256(15));
        owner = msg.sender;
        tokenVault = _tokenVault;
        erc20Ethereum = _erc20Ethereum;
        invariant = (msg.value * (_tokenAmount + tokenVaultAmount)) / _getUnitDecimals();

        //Interactions
        transferFromTokenContract(msg.sender, _tokenVault, _tokenAmount, _erc20Ethereum);
    }

    function getExchangeRate() external view returns (uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected + (1 ether)))); 
       
        return result;
    }

    function calculateTokensPerEthers() private view returns(uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance;
        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected))); 
        return result;
    }

    function calculateEthersToSellTokens(uint256 _tokenAmount) private view returns(uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result =  (balanceOfContract  - feesCollected) - ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault + _tokenAmount) ); 
        
        return result;
    } 

    function calculateEtherAmount(uint256 _tokenAmount) external view returns(uint256)
    {
         // Checks
        if (_tokenAmount == 0) {
           revert("Invalid _tokenAmount value");
        }

         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result =  ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault - _tokenAmount) ) - (balanceOfContract  - feesCollected); 
        return result;
    }

    function calculateEthersToBuyTokens(uint256 _tokenAmount, uint256 _ethersOfTransaction) private view returns(uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result =  ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault - _tokenAmount) ) - (balanceOfContract  - feesCollected - _ethersOfTransaction); 
        
        return result;
    }

    function buyToken(uint256 _amountTokenToBuy) external payable{
         // Checks
        if (_amountTokenToBuy == 0) 
        {
           revert("Invalid _amountToBuy value");
        }
   
        uint256 etherAmountToCollect = calculateEthersToBuyTokens(_amountTokenToBuy, msg.value) ;
        uint256 feeToCharge = (etherAmountToCollect * feePercentage) / 1 ether; 
        if (msg.value < (etherAmountToCollect + feeToCharge))
        {
             revert("Insufficient ethers");
        }

        // Effects
        etherAmountToCollect += feeToCharge;
        feesCollected += feeToCharge;

        //Interactions
        if (msg.value > etherAmountToCollect)
        {
            payable(msg.sender).transfer(msg.value - etherAmountToCollect);
        }  
        transferFromTokenContract(tokenVault, msg.sender, _amountTokenToBuy, erc20Ethereum);
    }

    function buyEther(uint256 _amountTokenToExchage) external
    {
         // Checks
        if (_amountTokenToExchage == 0) 
        {
           revert("Invalid _amountToExchange value");
        }
         _isInsuffientBalance(msg.sender, _amountTokenToExchage,erc20Ethereum);
        uint256 etherAmountToPay = calculateEthersToSellTokens(_amountTokenToExchage);
        uint256 feeToCharge;
        if(feePercentage < 1 ether){
              feeToCharge = (etherAmountToPay * feePercentage) / 1 ether; 
        }
        else
        {
             feeToCharge = ((etherAmountToPay * feePercentage) / _convertValueWithDecimals(100)); 
        }
        
        if((address(this).balance - feesCollected)  < (etherAmountToPay- feeToCharge))
        {
            revert("Insufficient balance");
        }

         // Effects
        etherAmountToPay -= feeToCharge;
        feesCollected += feeToCharge;
      
        //Interactions
        payable(msg.sender).transfer(etherAmountToPay);
        transferFromTokenContract(msg.sender, tokenVault, _amountTokenToExchage, erc20Ethereum);
    }

    function setFeePercentage(uint256 _feePercentage) external{
         // Checks
        
        if (_feePercentage == 0) 
        {
           revert("Invalid _feePercentage value");
        }
         _isOwnerProtocol(msg.sender);

        // Effects
        feePercentage = _feePercentage;
    }

    function deposit() external payable
    {
         // Checks
        if (msg.value == 0) 
        {
           revert("No ethers deposited");
        }
         _isOwnerProtocol(msg.sender);
         uint256 amountToExchange = calculateTokensPerEthers();
        _isInsuffientBalance(msg.sender, amountToExchange, erc20Ethereum);

        //Interactions
         transferFromTokenContract(msg.sender, tokenVault, amountToExchange, erc20Ethereum);
    }

    function withdrawFeesAmount() external
    {
        // Checks
        _isOwnerProtocol(msg.sender);
        uint256 feeAux = feesCollected;
        feesCollected = 0;
        uint256 minFees = 5 * (10 ** uint256(16));  
        if(feeAux < minFees)
        {
             revert("Insufficient amount of fees");
        }
        
        //Interactions
        payable(msg.sender).transfer(feeAux);
    }

    function setTokenVault(address _tokenVault) external{

        // Checks
         if (_tokenVault == address(0)) {
           revert("Invalid address _tokenVault");
        }
        if (_isSmartContractAddress(_tokenVault) == true){
            revert("_tokenVault cannot be a contract");
        }
        _isOwnerProtocol(msg.sender);

        uint256 tokenVaultBalance = balanceOfTokenContract(_tokenVault, erc20Ethereum);
        if(tokenVaultBalance == 0)
        {
            revert("_tokenVault has no balance");
        }

        uint256 result = allowanceTokenContract(_tokenVault, address(this), erc20Ethereum);
        if (result <= 0)
        {
            revert("Invalid tokenVault address");
        }
     
        // Effects
        invariant = (tokenVaultBalance * (address(this).balance - feesCollected)) / 1 ether;
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

    function _isInsuffientBalance(address _address, uint256 _amountToVerify,address _erc20Ethereum) internal virtual view 
    {
        uint256 tokenAmountBalance = balanceOfTokenContract(_address, _erc20Ethereum);
        if (tokenAmountBalance < _amountToVerify)
        {
             revert("Insufficient balance");
        }
    }

    function _convertValueWithDecimals(uint256 value) private view returns(uint256)
    {
        uint256 result = value * (10 ** decimalsToken);

        return result;
    }

    function transferFromTokenContract(address _from, address _to, uint256 _value, address _erc20Ethereum) private  {
            ITokenContract(_erc20Ethereum).transferFrom(_from, _to,_value);
    }

    function balanceOfTokenContract(address _from, address _erc20Ethereum) private  view returns (uint256) {
            return ITokenContract(_erc20Ethereum).balanceOf(_from);
    }

     function allowanceTokenContract(address _owner, address _spender, address _erc20Ethereum) private view returns (uint256)  {
            return ITokenContract(_erc20Ethereum).allowance(_owner, _spender);
    }
}