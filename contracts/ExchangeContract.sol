// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./TokenContract.sol";


abstract contract ExchangeContract {

    /// STATE VARIABLES
    address private _tokenVault;
    address private _erc20Contract;
    uint8 private _decimalsToken;
    uint8 private _feePercentage;
    address private _owner;
    uint256 private _invariant;
    uint8 private _feesCollected;

    /*
     * @notice Initialize the state of the contract
     * @dev Throw if `_tokenVault` is zero address. Message: "Invalid address _tokenVault"
     * @dev Throw if `_tokenVault` is a smart contract. Message: "_tokenVault cannot be a contract"
     * @dev Throw if `_erc20Contract` is zero address. Message: "Invalid address _erc20Contract"
     * @dev Throw if `_erc20Contract` is not a smart contract. Message: "_erc20Contract is not a contract"
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     */
     
    constructor(address tokenVault, address erc20Contract , uint256 tokenAmount) payable

    {
         // Checks
        _isZeroAddress(tokenVault, '_tokenVault');
        if (_isSmartContractAddress(tokenVault) == true){
            revert("_tokenVault cannot be a contract");
        }
        _isZeroAddress(erc20Contract, '_erc20Contract');
        if (_isSmartContractAddress(erc20Contract) == false){
            revert("_erc20Contract is not a contract");
        }
        _isZeroValue(tokenAmount, '_tokenAmount');
        //TODO:
        uint256 tokenVaultAmount = TokenContract(_tokenVault).balanceOf(_tokenVault);
        if (tokenVaultAmount < tokenAmount){
            revert("Insufficient tokens in the vault");
        }

        // Effects
        _decimalsToken = 18;
        _feePercentage = 3;
        _owner = msg.sender;
        _tokenVault = tokenVault;
        _erc20Contract = erc20Contract;
        _invariant = msg.value * tokenAmount;
    }

    function getExchangeRate() public returns (uint256){
        uint256 tokenAmount = TokenContract(_tokenVault).balanceOf(_owner);
        return (tokenAmount - (_invariant / _owner.balance));
    }

    function buyToken(uint256 _amountToBuy) external{
        _isZeroValue(_amountToBuy, '_amountToBuy');
        uint256  etherAmountNeeded = calculateEtherAmount(_amountToBuy);
        uint256 feeToCharge = etherAmountNeeded * _feePercentage;
        etherAmountNeeded += feeToCharge;
        
        if (msg.value < etherAmountNeeded){
            revert("Insufficient ethers");
        }

        bool result = TokenContract(_tokenVault).transfer(msg.sender, _amountToBuy);
        if (result){
            if (msg.value > etherAmountNeeded){
                msg.sender.transfer(msg.value - etherAmountNeeded);
            }
            _feesCollected += feeToCharge;
        }else{
            revert("An error has occurred");
        }
    }

    function buyEther(uint256 _amountToExchage) external{
        _isZeroValue(_amountToExchage, '_amountToExchage');
        _isInsuffientBalance(msg.sender, _amountToExchage);
        uint256  etherAmountNeeded = calculateEtherAmount(_amountToExchage);
        uint256 feeToCharge = etherAmountNeeded * _feePercentage;
        etherAmountNeeded -= feeToCharge;

        bool result = TokenContract(_tokenVault).transferFrom(msg.sender, _tokenVault, _amountToExchage);
        if (result){
            msg.sender.transfer(etherAmountNeeded);
            _feesCollected += feeToCharge;
        }else{
            revert("An error has occurred");
        }
    }

    function setFeePercentage(uint256 feePercentage) external view{
        _isZeroValue(feePercentage, '_feePercentage');
        _isOwnerProtocol(msg.sender);

        _feePercentage = feePercentage;
    }

    function deposit() external{
        _isOwnerProtocol(msg.sender);
        uint256 amountToExchange = getExchangeRate() * msg.value;
        _isInsuffientBalance(msg.sender, amountToExchange);
        
        bool result = TokenContract(_tokenVault).transferFrom(msg.sender, _tokenVault, amountToExchange);
        if (!result){
            revert("An error has occurred");
        }
    }

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------
    function _isOwnerProtocol(address _address) private view {
        if (_owner != _address) {
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

    function _isInsuffientBalance(address _address, uint256 _amountToExchage) internal virtual pure {
        uint256 senderTokenAmount = TokenContract(_tokenVault).balanceOf(_address);
        if (senderTokenAmount < _amountToExchage){
            revert("Insufficient balance");
        }
    }
}