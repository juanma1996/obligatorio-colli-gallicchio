// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "./TokenContractAbstract.sol";

contract TokenContractPolygon is TokenContractAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens are transferred
    /// @dev On new tokens creation, trigger with the `from` address set to zero address
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    /// STATE VARIABLES
    uint256 private maxSupplyPolygon;
    uint256 private totalSupplyPolygon;

    constructor(string memory _name, string memory _symbol) TokenContractAbstract(_name, _symbol)
    {
        maxSupplyPolygon = 500000;
        totalSupplyPolygon = 500000;
        balanceOf[msg.sender] = 500000;
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
        _isZeroValue(_amountToMint, _methodName, '_amountToMint');
        _isZeroAddress(_recipient, _methodName, '_recipient');
        _isMaxSupply(_methodName, _amountToMint);

        // Effects
        totalSupplyPolygon += _amountToMint;
        balanceOf[msg.sender] += _amountToMint;
        emit Transfer(address(0), msg.sender, _amountToMint);
    }

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------

    function _isMaxSupply(string memory _methodName, uint256 _amountToMint) private view {
        if (maxSupplyPolygon > 0 && totalSupplyPolygon + _amountToMint > maxSupplyPolygon) {
            string memory _message = _concatMessage(_methodName, " - Total supply exceeds maximum supply", "");
            revert(_message);
        }
    }
}