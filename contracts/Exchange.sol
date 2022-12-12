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
     * @dev Throw if `_erc20Contract` is zero address. Message: "_erc20Contract cannot be zero address"
     * @dev Throw if `_erc20Contract` is not a smart contract. Message: "_erc20Contract is not a contract"
     * @dev Throw if `_tokenAmount` is zero value. Message: "Invalid _tokenAmount value"
     * @dev Throw if `_tokenAmount` bigger than _tokenVault balance. Message: "Insufficient tokens in the vault"
     * @param _tokenVault The address of tokenVault to set
     * @param _erc20Ethereum The address of ERC20 Ethereum Contract
     * @param _tokenAmount The amount of Tokens to set in the tokenVault
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

    /*
    * @notice It must return the amount of tokens that is obtained for an ether at the moment of the query.
    */
    function getExchangeRate() external view returns (uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected + (1 ether)))); 
       
        return result;
    }

    /*
    * @notice It must return the amount of tokens that is obtained according to the balance value.
    */
    function calculateTokensPerEthers() private view returns(uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance;
        uint256 result = tokenAmountOfTokenVault - ((invariant * _getUnitDecimals()) / ((balanceOfContract - feesCollected))); 
        return result;
    }

    /*
    * @notice It must return the amount of ethers that is obtained for sell an amount ok tokens.
    */
    function calculateEthersToSellTokens(uint256 _tokenAmount) private view returns(uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result =  (balanceOfContract  - feesCollected) - ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault + _tokenAmount) ); 
        
        return result;
    } 

    /*
     * @notice Return the amount of ethers needed to buy the amount of tokens
     * @dev Throw if `_tokenVault` is zero address. Message: "Invalid _tokenAmount value"
     * @param _tokenAmount. The amount of token to buy
     */
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

    /*
    * @notice It must return the amount of ethers that is obtained for buy an amount ok tokens.
    */
    function calculateEthersToBuyTokens(uint256 _tokenAmount, uint256 _ethersOfTransaction) private view returns(uint256)
    {
         // Effects
        uint256 tokenAmountOfTokenVault = balanceOfTokenContract(tokenVault, erc20Ethereum);
        uint256 balanceOfContract = address(this).balance; 
        uint256 result =  ((invariant * _getUnitDecimals()) / (tokenAmountOfTokenVault - _tokenAmount) ) - (balanceOfContract  - feesCollected - _ethersOfTransaction); 
        
        return result;
    }

    /*
     * @notice Buy of Tokens
     * @dev Throw if ethers received is insufficient to buy amount of Tokens. Message: "Insufficient ethers"
     * @dev Throw if `_amountToBuy` is zero value. Message: "Invalid _amountToBuy value"
     * @param _amountTokenToBuy. The amount of token to buy
     */
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

    /*
     * @notice Buy of Ethers
     * @dev Throw if Exchange contract not have sufficient balance. Message: "Insufficient balance"
     * @dev Throw if `_amountTokenToExchage` is zero value. Message: "Invalid _amountToExchage value"
     * @param _amountTokenToExchage. The amount of token to exchange for ethers.
     */
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

    /*
     * @notice Establishes the percentage that is charged for each operation
     * @dev Throw if msg.sender is not the owner of the protocol. Message: "Not authorized"
     * @dev Throw if `_percentage` is zero value. Message: "Invalid _feePercentage value"
     * @param _percentage. The percentage to set.
     */
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

    /*
     * @notice Allow the owner of the protocol to increase the liquidity of the pool
     * @dev Throw if msg.sender is not the owner of the protocol. Message: "Not authorized"
     * @dev Throw if msg.value is zero value. Message: "No ethers deposited"

     */
    function deposit() external payable
    {
         // Checks
        if (msg.value == 0) 
        {
           revert("No ethers deposited");
        }
         _isOwnerProtocol(msg.sender);
         uint256 amountTokensToExchange = calculateTokensPerEthers();
        _isInsuffientBalance(msg.sender, amountTokensToExchange, erc20Ethereum);
         uint256 tokenVaultBalanceBefore = balanceOfTokenContract(tokenVault, erc20Ethereum);
        invariant = ( (tokenVaultBalanceBefore + amountTokensToExchange) * (address(this).balance - feesCollected)) / 1 ether;

        //Interactions
         transferFromTokenContract(msg.sender, tokenVault, amountTokensToExchange, erc20Ethereum);
    }

    /*
     * @notice Allow only the owner of the protocol to withdraw the profits obtained for the fees
     * @dev Throw if The minimum withdrawal amount must be 0.5 ethers. Message: "Not authorized"
     * @dev Throw if `_percentage` is zero value. Message: "Insufficient amount of fees"
     */
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

    /*
     * @notice Sets the address of the account from which the tokens will be obtained to make the exchanges.
     * @dev Throw if msg.sender is not the owner of the protocol. Message: "Not authorized"
     * @dev Throw if `_tokenVault` is zero address. Message: "Invalid address _tokenVault"
     * @dev Throw if `_tokenVault` is address of smart contract. Message: "_tokenVault cannot be a contract"
     * @dev Throw if `_tokenVault` balance is zero value. Message: "_tokenVault has no balance"
     * @dev Throw if exchange contract not have authorization to operate Tokens of `_tokenVault`. Message: "Invalid tokenVault address"
     * @param _tokenVault. The address to set.
     */
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