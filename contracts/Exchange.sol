// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/ITokenContract.sol";
import "hardhat/console.sol";
contract Exchange {

    /// STATE VARIABLES
    address public tokenVault;
    address public erc20Ethereum;
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
      
        transferFromTokenContract(msg.sender, _tokenVault, _tokenAmount, _erc20Ethereum);
       
        // Effects
        decimalsToken = 18;
        feePercentage = 3 * (10 ** uint256(15));
        owner = msg.sender;
        tokenVault = _tokenVault;
        erc20Ethereum = _erc20Ethereum;
        invariant = (msg.value * (_tokenAmount + tokenVaultAmount)) / _getUnitDecimals();
    }

    function getExchangeRate() external view returns (uint256)
    {
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected + (1 ether)))); 
       
        return result;
    }

    function calculateEtherAmount(uint256 _tokenAmount) external view returns(uint256)
    {
        
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        
        uint256 result =  ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault - _tokenAmount) ) - (balanceOfContract  - feesCollected); 
        console.log("Result calculateEtherAmount", result);
        return result;
    }

    function calculateTokensPerEthers() private view returns(uint256)
    {
        
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance;
        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected))); 
        return result;
    }

     function calculateEthersToSellTokens(uint256 _tokenAmount) private view returns(uint256)
    {
        
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        
        uint256 result =   (balanceOfContract - feesCollected)  - ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault + _tokenAmount) ); 

        return result;
    }

    function calculateEthersToBuyTokens(uint256 _tokenAmount, uint256 _ethersOfTransaction) private view returns(uint256)
    {
        
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result =  ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault - _tokenAmount) ) - (balanceOfContract - _ethersOfTransaction - feesCollected); 
       
        return result;
    }

    function buyToken(uint256 _amountTokenToBuy) external payable{
        if (_amountTokenToBuy == 0) {
           revert("Invalid _amountToBuy value");
        }
   
        uint256 etherAmountToCollect = calculateEthersToBuyTokens(_amountTokenToBuy, msg.value) ;
        
        uint256 feeToCharge = (etherAmountToCollect * feePercentage) / 1 ether; 
        
        etherAmountToCollect += feeToCharge;
        feesCollected += feeToCharge;
        if (msg.value < etherAmountToCollect)
        {
             revert("Insufficient ethers");
        }

        transferFromTokenContract(tokenVault, msg.sender, _amountTokenToBuy, erc20Ethereum);

        if (msg.value > etherAmountToCollect)
        {
            payable(msg.sender).transfer(msg.value - etherAmountToCollect);
        }  
    }

    function buyEther(uint256 _amountTokenToExchage) external
    {
        if (_amountTokenToExchage == 0) 
        {
           revert("Invalid _amountToExchage value");
        }
    
         _isInsuffientBalance(msg.sender, _amountTokenToExchage,erc20Ethereum);
       
        uint256 etherAmountToPay = calculateEthersToSellTokens(_amountTokenToExchage) ;
      
        uint256 feeToCharge = (etherAmountToPay * feePercentage) / 1 ether; 
        etherAmountToPay -= feeToCharge;
        
        if((address(this).balance - feesCollected)  < etherAmountToPay)
        {
            revert("Insufficient balance");
        }
        feesCollected += feeToCharge;
        transferFromTokenContract(msg.sender, tokenVault, _amountTokenToExchage, erc20Ethereum);
        
        payable(msg.sender).transfer(etherAmountToPay);
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
      
         uint256 amountToExchange = calculateTokensPerEthers();
         _isInsuffientBalance(msg.sender, amountToExchange, erc20Ethereum);

         transferFromTokenContract(msg.sender, tokenVault, amountToExchange, erc20Ethereum);
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

        uint256 tokenVaultBalance = balanceOfTokenContract(_tokenVault, erc20Ethereum);
        if(tokenVaultBalance == 0)
        {
            revert("_tokenVault has no balance");
        }

        uint256 result = allowanceTokenContract(_tokenVault, address(this), erc20Ethereum);
        if (result <= 0){
            revert("Invalid tokenVault address");
        }
        
        
        invariant = tokenVaultBalance * (address(this).balance - feesCollected);
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

    function transferTokenContract(address _to, uint256 _value, address _erc20Ethereum) private  {
            ITokenContract(_erc20Ethereum).transfer(_to,_value);
    }

     function allowanceTokenContract(address _owner, address _spender, address _erc20Ethereum) private view returns (uint256)  {
            return ITokenContract(_erc20Ethereum).allowance(_owner, _spender);
    }
}