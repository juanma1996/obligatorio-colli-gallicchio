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
        // TODO:
        transferFromTokenContract(msg.sender, _tokenVault, _tokenAmount, _erc20Contract);
       
        uint256 tokenVaultAmount = balanceOfTokenContract(_tokenVault, _erc20Contract);
        if (tokenVaultAmount < _tokenAmount){
            revert("Insufficient tokens in the vault");
        }

        // Effects
        decimalsToken = 18;
        feePercentage = 3 * (10 ** uint256(15));
        owner = msg.sender;
        tokenVault = _tokenVault;
        erc20Contract = _erc20Contract;
        invariant = msg.value * _tokenAmount;
    }

    function getExchangeRate() external view returns (uint256)
    {
        uint256 result = calculateTokenPerEther(1 ether);

        return result;
    }

    function calculateTokenPerEther(uint256 _etherAmount) private view returns(uint256)
    {
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Contract);
        
        uint256 balanceOfContract = address(this).balance; 
        uint256 result = tokenAmountOfTokenVault - (invariant / (balanceOfContract + _etherAmount));

        return result;
    }

    function calculateEtherPerToken(uint256 _tokenAmount, uint256 _ethersOfTransaction) private view returns(uint256)
    {
        
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Contract);
        
        uint256 tokenAmountToExchange = _convertValueWithDecimals(_tokenAmount);
        
        uint256 balanceOfContract = address(this).balance; 
        
        
        console.log("Balance of Contract", balanceOfContract);
        console.log("Eterhs of transaction", _ethersOfTransaction);
        console.log("Invariant", invariant);
        console.log("Token Ok Token Vault", tokenAmountOfTokenVault);
        console.log("Token To Exchange", tokenAmountToExchange);
        console.log("Fees Collected", feesCollected);
        uint256 result = (balanceOfContract - _ethersOfTransaction - feesCollected) - (invariant / (tokenAmountOfTokenVault + tokenAmountToExchange));

        console.log("Result", result);
        return result;
    }

    function buyToken(uint256 _amountTokenToBuy) external payable{
  
       
        if (_amountTokenToBuy == 0) {
           revert("Invalid _amountToBuy value");
        }
   
        uint256 etherAmountToCollect = calculateEtherPerToken(_amountTokenToBuy, msg.value);
        uint256 feeToCharge = (etherAmountToCollect * feePercentage) / _convertValueWithDecimals(100);
        etherAmountToCollect += feeToCharge;
        console.log("Fees to charge ", feeToCharge);
        feesCollected += feeToCharge;
        if (msg.value < etherAmountToCollect){
             revert("Insufficient ethers");
        }

        transferFromTokenContract(tokenVault, msg.sender, _convertValueWithDecimals(_amountTokenToBuy), erc20Contract);

        if (msg.value > etherAmountToCollect){
            payable(msg.sender).transfer(msg.value - etherAmountToCollect);
        }  
        console.log("Fees Collected final ", feesCollected);
    }

    function buyEther(uint256 _amountTokenToExchage) external payable{
        if (_amountTokenToExchage == 0) 
        {
           revert("Invalid _amountToExchage value");
        }
        uint256 tokenAmountToExchange = _convertValueWithDecimals(_amountTokenToExchage);
        _isInsuffientBalance(msg.sender, tokenAmountToExchange);
        
        uint256  etherAmountToPay = calculateEtherPerToken(_amountTokenToExchage, 0);
        uint256 feeToCharge = (etherAmountToPay * feePercentage) / _convertValueWithDecimals(100);
        
        etherAmountToPay -= feeToCharge;
        feesCollected += feeToCharge;
        if(address(this).balance < etherAmountToPay)
        {
            revert("Insufficient balance");
        }
        transferFromTokenContract(msg.sender, tokenVault, tokenAmountToExchange, erc20Contract);
        
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
         uint256 amountToExchange = calculateTokenPerEther(msg.value);
         _isInsuffientBalance(msg.sender, amountToExchange);
        
        transferFromTokenContract(msg.sender, tokenVault, amountToExchange, erc20Contract);
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

    // /// ------------------------------------------------------------------------------------------------------------------------------------------
    // /// PRIVATE FUNCTIONS
    // /// ------------------------------------------------------------------------------------------------------------------------------------------
     function _isOwnerProtocol(address _address) private view {
         if (owner != _address) {
             revert("Not authorized");
         }
     }
    
    function _isZeroValue(uint256 _value, string memory _parameterName) internal virtual pure {
        if (_value == 0) {
            string memory _message = string.concat("Invalid ", _parameterName, " value");
             revert(_message);
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
        uint256 decimalsValueTokenContract = decimalsTokenContract(erc20Contract);
        uint256 result = value * (10 ** uint256(decimalsValueTokenContract));

        return result;
    }

    /*
     * @notice Call Mint Mehod of ERC20-M2
     */
     function transferFromTokenContract(address _from, address _to, uint256 _value, address _erc20Conctract) private  {
            ITokenContract(_erc20Conctract).transferFrom(_from, _to,_value);
    }

    function balanceOfTokenContract(address _from, address _erc20Conctract) private  view returns (uint256) {
            return ITokenContract(_erc20Conctract).balanceOf(_from);
    }

    function decimalsTokenContract(address _erc20Conctract) private view returns (uint256) {
            return ITokenContract(_erc20Conctract).decimals();
    }

     function transferTokenContract(address _to, uint256 _value, address _erc20Conctract) private  {
            ITokenContract(_erc20Conctract).transfer(_to,_value);
    }
}