// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./BridgeContractAbstract.sol";
import "./interfaces/ITokenContract.sol";

contract PolygonBridgeContract is BridgeContractAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens are minted on Polygon
    /// @dev Trigger with the `to` address and token amount
    event MintOrder(address indexed _to, uint256 _tokenAmount);

    constructor(address vaulContract) BridgeContractAbstract(vaulContract){}
    
    function mintTo(address _to, uint256 _tokenAmount) external{
        _isOwnerProtocol(msg.sender);
        _isZeroAddress(_to, '_to');
        _isZeroValue(_tokenAmount, '_tokenAmount');
        if (_blacklistAddress[_to]) {
            revert("_to address is in blacklist");
        }
        uint256 totalSupply = ITokenContract(erc20Contract()).totalSupply();
        if (totalSupply < _tokenAmount) {
            revert("_tokenAmount exceeds max supply");
        }

        emit MintOrder(_to, _tokenAmount);(_to, _tokenAmount); 
    }
}