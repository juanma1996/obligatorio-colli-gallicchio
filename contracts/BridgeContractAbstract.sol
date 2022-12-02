// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


abstract contract BridgeContractAbstract {

    /// STATE VARIABLES
    address private _owner;

    /// STATE MAPPINGS
    mapping(address => bool) public _blacklistAddress;

    constructor()
    {
        _owner = msg.sender;
    }

    function owner() public virtual view returns (address){
        return _owner;
    }

    function addAddressToBlackList(address _invalidAddress) public virtual{
        _isZeroAddress(_invalidAddress, '_invalidAddress');
        if (_owner == _invalidAddress) {
            revert("Invalid address _invalidAddress");
        }
        _isBlacklistAddress(_invalidAddress);
        _blacklistAddress[_invalidAddress] = true;
    }

    /// ------------------------------------------------------------------------------------------------------------------------------------------
    /// PRIVATE FUNCTIONS
    /// ------------------------------------------------------------------------------------------------------------------------------------------

    function _isZeroAddress(address _address, string memory _parameterName) internal virtual pure {
        if (_address == address(0)) {
            string memory _message = string.concat( _parameterName, " cannot be zero address");
            revert(_message);
        }
    }

    function _isBlacklistAddress(address _address) internal virtual {
        if (_blacklistAddress[_address]) {
            revert("Address already in the list");
        }
    }
}