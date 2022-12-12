// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/ITokenContract.sol";

abstract contract BridgeAbstract {

    /// STATE VARIABLES
    address private _owner;
    address internal _erc20Contract;

    /// STATE MAPPINGS
    mapping(address => bool) public _blacklistAddress;

    constructor()
    {
        _owner = msg.sender;
    }

    function owner() public virtual view returns (address){
        return _owner;
    }

    function erc20Contract() public virtual view returns (address){
        return _erc20Contract;
    }

    /*
     * @notice Add an address to black list
     * @dev Throw if `_invalidAddress` is zero address. Message: "_invalidAddress cannot be zero address"
     * @dev Throw if `_invalidAddress` is the address of owner. Message: "Invalid address _invalidAddress"
     * @dev Throw if `_invalidAddress` is already in the list. Message: "Address already in the list"
     * @param _invalidAddress. The address to add to the list.
     */
    function addAddressToBlackList(address _invalidAddress) public virtual{
        _isZeroAddress(_invalidAddress, '_invalidAddress');
        if (_owner == _invalidAddress) {
            revert("Invalid address _invalidAddress");
        }
        _isBlacklistAddress(_invalidAddress);
        _blacklistAddress[_invalidAddress] = true;
    }

     /*
     * @notice Add an address to black list
     * @dev Throw if `_invalidAddress` is zero address. Message: "Invalid address _invalidAddress"
     * @dev Throw if `_invalidAddress` is not yet in the list. Message: "Address not found"
     * @param _invalidAddress. The address to remove from the list.
     */
    function removeAddressFromBlackList(address _invalidAddress) public virtual{
        if (_invalidAddress == address(0)) {
            revert("Invalid address _invalidAddress");
        }
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

    function _exceedsMaxSupply(uint256 _tokenAmount) internal virtual view 
    {
        uint256 maxSupply =   maxSupplyTokenContract(erc20Contract());
        if ( _tokenAmount  > maxSupply) 
        {
            revert("_tokenAmount exceeds max supply");
        }
    }

    function maxSupplyTokenContract(address _erc20Conctract) private view returns (uint256)  {
            return ITokenContract(_erc20Conctract).maxSupply();
    }
}