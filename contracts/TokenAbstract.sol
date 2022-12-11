// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


abstract contract TokenAbstract {

    /// STATE VARIABLES
    string internal  _nameToken = "";
    string internal _symbolToken = "";
    uint8 internal _decimalsToken;
    uint256 internal _maxSupplyToken;
    uint256 internal _totalSupplyToken;

    address public owner;

    /// STATE MAPPINGS
    mapping(address => uint256) public balanceOf;

    /**
     * @notice Initialize the state of the contract
     * @dev Throw if `_name` is empty. Message: "constructor - Invalid parameter: _name"
     * @dev Throw if `_symbol` is empty. Message: "constructor - Invalid parameter: _symbol"
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     */
     
    constructor(string memory _name, string memory _symbol, uint256 _maxSupply)
    {
         // Checks
        string memory _methodName = 'constructor';
        _isEmptyString(_name, _methodName, '_name');
        _isEmptyString(_symbol, _methodName, '_symbol');
        // Effects
        _nameToken = _name;
        _symbolToken = _symbol;
        _maxSupplyToken = _maxSupply;
        _decimalsToken = 18;
        owner = msg.sender;
    }

    function name() public virtual view returns (string memory){
        return _nameToken;
    }

     function symbol() public virtual view returns (string memory)
    {
        return _symbolToken;
    }

    function decimals() public virtual view returns (uint8)
    {
        return _decimalsToken;
    }

    function totalSupply() public virtual view returns (uint256)
    {
        return _totalSupplyToken;
    }

    function maxSupply() public virtual view returns (uint256)
    {
        return _maxSupplyToken;
    }

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------

    function _concatMessage(string memory _methodName, string memory _message, string memory _parameterName) internal virtual pure returns(string memory) {
        return string.concat(_methodName, _message, _parameterName);
    }

    function _isEmptyString(string memory _value, string memory _methodName, string memory _parameterName) internal virtual pure {
        if (bytes(_value).length == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isZeroValue(uint256 _value, string memory _methodName, string memory _parameterName) internal virtual pure {
        if (_value == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isZeroAmount(uint256 _value, string memory _methodName, string memory _parameterName) internal virtual pure {
        if (_value == 0) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isZeroAddress(address _address, string memory _methodName, string memory _parameterName) internal virtual pure {
        if (_address == address(0)) {
            string memory _message = _concatMessage(_methodName, " - Invalid parameter: ", _parameterName);
            revert(_message);
        }
    }

    function _isValidRecipient(address _remittent, address _recipient, string memory _methodName) internal virtual pure {
        if (_recipient == _remittent) {
            string memory _message = _concatMessage(_methodName, " - Invalid recipient, same as remittent", "");
            revert(_message);
        }
    }

     function _hasSufficientBalance(address _address, uint256 _value, string memory _methodName) internal virtual view {
        if (balanceOf[_address] < _value) {
            string memory _message = _concatMessage(_methodName, " - Insufficient balance", "");
            revert(_message);
        }
    }
}