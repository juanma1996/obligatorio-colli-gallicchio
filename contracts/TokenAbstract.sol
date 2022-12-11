// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


abstract contract TokenAbstract {

    /// STATE VARIABLES
    string internal  _nameToken = "";
    string internal _symbolToken = "";
    uint256 internal _decimalsToken;
    uint256 internal _maxSupplyToken;
    uint256 internal _totalSupplyToken;

    address public owner;

    /// STATE MAPPINGS
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;


    /// EVENTS
     
    /// @notice Trigger when tokens are transferred
    /// @dev On new tokens creation, trigger with the `from` address set to zero address
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    /// @notice Trigger on any successful call to `approve` method
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);


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

    function decimals() public virtual view returns (uint256)
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
        if (_from != msg.sender) 
        {
            uint256 currentAllowance = allowance[_from][msg.sender];
            allowance[_from][msg.sender] = currentAllowance - _value;
        }
        emit Transfer(msg.sender, _to, _value);
    }

    /**
     * @notice Allows `_spender` to withdraw from sender account multiple times, up to the `_value` amount
     * On success must fire the `Approval` event.
     * @dev If this function is called multiple times it overwrites the current allowance with `_value`
     * @dev Throw if `_spender` is zero address. Message: "approve - Invalid parameter: _spender"
     * @dev Throw if `_value` exceeds the sender's balance. Message: "approve - Insufficient balance"
     * @param _spender It is the spender account address
     * @param _value It is the allowance amount.
     */
    function approve(address _spender, uint256 _value) external {
   
        // Checks
        string memory _methodName = 'approve';
        _isZeroAddress(_spender, _methodName, '_spender');
        _hasSufficientBalance(msg.sender, _value, _methodName);

        // Effects
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
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

     function _isAuthorized(address _owner, address _spender, uint256 _value, string memory _methodName) private view {
        if (_owner != _spender && allowance[_owner][_spender] < _value) {
            string memory _message = _concatMessage(_methodName, " - Insufficent allowance", "");
            revert(_message);
        }
    }
}