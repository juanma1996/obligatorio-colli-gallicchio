// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


abstract contract BridgeContractAbstract {

    /// STATE VARIABLES
    address private _owner;
    address private _erc20Contract;

    /// STATE MAPPINGS
    mapping(address => bool) public _blacklistAddress;

    constructor(address vaulContract)
    {
        _owner = msg.sender;
        _erc20Contract = vaulContract;
    }

    function owner() public virtual view returns (address){
        return _owner;
    }

    function erc20Contract() public virtual view returns (address){
        return _erc20Contract;
    }

    function addAddressToBlackList(address _invalidAddress) public virtual{
        _isZeroAddress(_invalidAddress, '_invalidAddress');
        if (_owner == _invalidAddress) {
            revert("Invalid address _invalidAddress");
        }
        _isBlacklistAddress(_invalidAddress);
        _blacklistAddress[_invalidAddress] = true;
    }

    function removeAddressFromBlackList(address _invalidAddress) public virtual{
        _isZeroAddress(_invalidAddress, '_invalidAddress');//TODO: por letra dice: en cuyo caso revierte con el error ‘Invalid address _invalidAddress’. 
        _isNotBlacklistAddress(_invalidAddress);
        _blacklistAddress[_invalidAddress] = false;
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

    function _isBlacklistAddress(address _address) internal virtual view {
        if (_blacklistAddress[_address]) {
            revert("Address already in the list");
        }
    }

    function _isNotBlacklistAddress(address _address) internal virtual view {
        if (_blacklistAddress[_address] == false) {
            revert("Address not found");
        }
    }

    function _isOwnerProtocol(address _address) internal virtual view {
        if (_owner != _address) {
            revert("Not authorized");
        }
    }

    function _isZeroValue(uint256 _value, string memory _parameterName) internal virtual pure {
        if (_value == 0) {
            string memory _message = string.concat( _parameterName, " must be greater than zero");
            revert(_message);
        }
    }
}