// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "./TokenContractAbstract.sol";

contract TokenContract is TokenContractAbstract 
{

    /// STATE VARIABLES
    uint256 private _maxSupplyToken;
    uint256 private _totalSupplyToken;
    
     /// STATE MAPPINGS
     mapping(address => mapping(address => uint256)) public allowance;

     /// EVENTS
    /// @notice Trigger when tokens are transferred
    /// @dev On new tokens creation, trigger with the `from` address set to zero address
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
   
    constructor(string memory _name, string memory _symbol) TokenContractAbstract(_name, _symbol){
         _maxSupplyToken = 500000;
        _totalSupplyToken = 500000;}
    
    function totalSupply() public view returns (uint256)
    {
        return _totalSupplyToken;
    }

    function maxSupply() public view returns (uint256)
    {
        return _maxSupplyToken;
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
        // TODO: Implement method
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

    /**
     * @notice Transfers `_value` amount of tokens from address `_from` to address `_to`. 
     * On success must fire the `Transfer` event.
     * @dev Throw if `_from` is zero address. Message: "transferFrom - Invalid parameter: _from"
     * @dev Throw if `_to` is zero address. Message: "transferFrom - Invalid parameter: _to"
     * @dev Throw if `_to` is the same as `_from` account. Message: "transferFrom - Invalid recipient, same as remittent"
     * @dev Throw if `_value` is zero. Message: "transferFrom - Invalid parameter: _value"
     * @dev Throw if `_from` account has insufficient balance. Message: "transferFrom - Insufficient balance"
     * @dev Throws if `msg.sender` is not the current owner or an approved address with permission to spend the balance of the '_from' account
     * Message: "transferFrom - Insufficent allowance"
     * @param _from It is the remittent account address
     * @param _to It is the recipient account address
     * @param _value It is the amount of tokens to transfer.
     */
    function transferFrom(address _from, address _to, uint256 _value) external {
        // TODO: Implement method
        // Checks
        string memory _methodName = 'transferFrom';
        _isZeroAddress(_from, _methodName, '_from');
        _isZeroAddress(_to, _methodName, '_to');
        _isZeroAmount(_value, _methodName, '_value');
        _isValidRecipient(_from, _to, _methodName);
        _hasSufficientBalance(_from, _value, _methodName);
        _isAuthorized(_from, msg.sender, _value, _methodName);

        // Effects
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
    }

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------

    function _isAuthorized(address _owner, address _spender, uint256 _value, string memory _methodName) private view {
        if (_owner != _spender && allowance[_owner][_spender] <= _value) {
            string memory _message = _concatMessage(_methodName, " - Insufficent allowance", "");
            revert(_message);
        }
    }
   
}