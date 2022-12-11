// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "./TokenAbstract.sol";
import "hardhat/console.sol";

contract ERC20_Ethereum is TokenAbstract 
{

    constructor(string memory _name, string memory _symbol, uint256 _maxSupply) TokenAbstract(_name, _symbol, _maxSupply)
    {
        // Effects
        _maxSupplyToken = _maxSupply;
        _totalSupplyToken = _maxSupply;
        balanceOf[msg.sender] = _maxSupply;
    }
    
    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// EXTERNAL FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------

    /**
     * @notice Transfers `_value` amount of tokens from sender to address `_to`. On success must fire the `Transfer` event.
     * @dev Throw if `_to` is zero address. Message: "transfer - Invalid parameter: _to"
     * @dev Throw if `_to` is sender account. Message: "transfer - Invalid recipient, same as remittent"
     * @dev Throw if `_value` is zero. Message: "transfer - Invalid parameter: _value"
     * @dev Throw if remittent account has insufficient balance. Message: "transfer - Insufficient balance"
     * @param _to It is the recipient account address
     * @param _value It is the amount of tokens to transfer.
     */
    function transfer(address _to, uint256 _value) external {

        // Checks
        string memory _methodName = 'transfer';
        _isZeroAddress(_to, _methodName, '_to');
        _isZeroValue(_value, _methodName, '_value');
        _isValidRecipient(msg.sender, _to, _methodName);
        _hasSufficientBalance(msg.sender, _value, _methodName);

        // Effects
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
    }  
}