// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./BridgeContractAbstract.sol";
import "./TokenContract.sol";

contract EthereumBridgeContract is BridgeContractAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens are transfer to staking
    /// @dev Trigger with the `from` address and token amount
    event TransferToPolygon(address indexed _from, uint256 _tokenAmount);

    /// STATE VARIABLES
    uint256 private _maxAmountTokenPerTransfer;

    /// STATE MAPPINGS
    mapping(address => uint256) public _tokenStaking;

    constructor(address vaulContract) BridgeContractAbstract(vaulContract){}

    function transferToPolygon(uint256 _tokenAmount) external{
        _isZeroValue(_tokenAmount, '_tokenAmount');
        if (_tokenAmount > _maxAmountTokenPerTransfer) {
            revert("_tokenAmount exceeds max supply");
        }

        if (_blacklistAddress[msg.sender]) {
            revert("Invalid sender");
        }

        uint256 tokenVaultAmount = TokenContract(erc20Contract()).balanceOf(msg.sender);
        if (tokenVaultAmount < _tokenAmount){
            revert("Insufficient balance");
        }

        _tokenStaking[msg.sender] += _tokenAmount; 
        emit TransferToPolygon(msg.sender, _tokenAmount);       
    }

    function unStake(address ownerAddress, uint256 _tokenAmount) external{
        _isOwnerProtocol(ownerAddress);
        _isZeroAddress(ownerAddress, '_owner');
        _isZeroValue(_tokenAmount, '_tokenAmount');
        if (_blacklistAddress[ownerAddress]) {
            revert("_owner address is in blacklist");
        }

        if (_tokenStaking[ownerAddress] == 0){
            revert("_owner address has no stake");
        }

        if (_tokenStaking[ownerAddress] < _tokenAmount){
            revert("_tokenAmount value exceed staking");
        }

        
        _tokenStaking[ownerAddress] -= _tokenAmount;
    }

    
}