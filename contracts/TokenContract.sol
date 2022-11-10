// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


contract TokenContract {

    /// STATE VARIABLES
    string public name = "";
    string public symbol = "";
    uint8 public decimals;
    uint256 public totalSupply;
    uint256 public maxSupply;

     /// STATE MAPPINGS
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

     /// EVENTS
    /// @notice Trigger when tokens are transferred
    /// @dev On new tokens creation, trigger with the `from` address set to zero address
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
   
    /**
     * @notice Initialize the state of the contract
     * @dev Throw if `_name` is empty. Message: "constructor - Invalid parameter: _name"
     * @dev Throw if `_symbol` is empty. Message: "constructor - Invalid parameter: _symbol"
      @dev Throw if `_maxSupply` is zero or less zero. Message: "constructor - Invalid parameter: _maxSupply"
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _maxSupply The maximum supply of the token. Zero for unlimited emition
     */
    constructor(string memory _name, string memory _symbol, uint256 _maxSupply)
    {
         // Checks
        string memory _methodName = 'constructor';
        _isEmptyString(_name, _methodName, '_name');
        _isEmptyString(_symbol, _methodName, '_symbol');
        _isZeroValue(_maxSupply, _methodName, '_maxSupply');
        // Effects
        name = _name;
        symbol = _symbol;
        decimals= 18;
        maxSupply = _maxSupply;
    }

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

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------

    function _concatMessage(string memory _methodName, string memory _message, string memory _parameterName) private pure returns(string memory) {
        return string.concat(_methodName, _message, _parameterName);
    }

    function _isEmptyString(string memory _value, string memory _methodName, string memory _parameterName) private pure {
        if (bytes(_value).length == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isZeroValue(uint256 _value, string memory _methodName, string memory _parameterName) private pure {
        if (_value == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isZeroAddress(address _address, string memory _methodName, string memory _parameterName) private pure {
        if (_address == address(0)) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isValidRecipient(address _remittent, address _recipient, string memory _methodName) private pure {
        if (_recipient == _remittent) {
            string memory _message = _concatMessage(_methodName, " - Invalid recipient, same as remittent", "");
            revert(_message);
        }
    }

     function _hasSufficientBalance(address _address, uint256 _value, string memory _methodName) private view {
        if (balanceOf[_address] < _value) {
            string memory _message = _concatMessage(_methodName, " - Insufficient balance", "");
            revert(_message);
        }
    }
}