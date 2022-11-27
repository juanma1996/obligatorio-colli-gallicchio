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
        //HasSufficientBalance(tokenVault, tokenAmount)
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

    function getExchangeRate() external view returns (uint256){
        uint256 tokenAmount = TokenContract(_tokenVault).balanceOf(_owner);
        return (tokenAmount - (_invariant / _owner.balance));
    }

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------
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
}