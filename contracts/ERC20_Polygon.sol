// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "./TokenAbstract.sol";
import "hardhat/console.sol";
contract ERC20_Polygon is TokenAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens are transferred
    /// @dev On new tokens creation, trigger with the `from` address set to zero address
    event Burn(address indexed _from, uint256 _value);

    constructor(string memory _name, string memory _symbol, uint256 _maxSupply) TokenAbstract(_name, _symbol, _maxSupply)
    {
        // Effects
        _maxSupplyToken = _maxSupply;
        _totalSupplyToken = 0;
        balanceOf[msg.sender] = 0;
    }

    /**
     * @notice Issues a new amount of tokens in exchange for ethers at a parity of 1 to 1
     * @dev Throw if msg.value is zero. Message: "mint - Invalid ether amount"
     * @dev Throw if `_recipient` is zero address. Message: "mint - Invalid parameter: _recipient"
     * @dev Throw if total supply overcame the maximum supply. Message: "mint - Total supply exceeds maximum supply"
     * @param _recipient It is the recipient account for the new tokens
     * @param _amountToMint It is the amount of new tokens
     */
    function mint(address _recipient, uint256 _amountToMint) external{
        // Checks
        string memory _methodName = 'mint';
        _isZeroAddress(_recipient, _methodName, '_recipient');
        _isZeroValue(_amountToMint, _methodName, '_amountToMint');
        _isMaxSupply(_methodName, _amountToMint);

        // Effects
        _totalSupplyToken += _amountToMint;
        balanceOf[_recipient] += _amountToMint;
    }

    /**
     * @notice Returns ethers in exchange for burning an amount of tokens from '_from' account, at a parity of 1 to 1
     * @dev Throw if `_value` is zero. Message: "burn - Invalid parameter: _value"
     * @dev Throw if `_from` account has insufficient tokens to burn. Message: "burn - Insufficient balance"
     * @param _value It is the number of new tokens to be burned
     */
    function burn(uint256 _value) external {
        // Checks
        string memory _methodName = 'burn';
        _isZeroAddress(msg.sender, _methodName, '_from');
        _isZeroAmount(_value, _methodName, '_value');
        _hasSufficientBalance(msg.sender, _value, _methodName);

        // Effects
        balanceOf[msg.sender] -= _value;
        _totalSupplyToken -= _value;

        emit Burn(msg.sender, _value);
    }

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------

    function _isMaxSupply(string memory _methodName, uint256 _amountToMint) private view {
        if (_maxSupplyToken > 0 && _totalSupplyToken + _amountToMint > _maxSupplyToken) {
            string memory _message = _concatMessage(_methodName, " - Total supply exceeds maximum supply", "");
            revert(_message);
        }
    }
}
