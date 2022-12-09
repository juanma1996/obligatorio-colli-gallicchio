// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./BridgeContractAbstract.sol";
import "./interfaces/ITokenContractPolygon.sol";

contract PolygonBridgeContract is BridgeContractAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens need to be burn on ERC-20 contract
    /// @dev Trigger with the `from` address and token amount
    event TransferToEthereum(address indexed _to, uint256 _tokenAmount);

    /// @notice Trigger when tokens are minted on Polygon
    /// @dev Trigger with the `to` address and token amount
    event MintOrder(address indexed _to, uint256 _tokenAmount);

    constructor(address erc20Conctract) BridgeContractAbstract(){
         if (erc20Conctract == address(0)) {
            revert("Invalid address _erc20Contract");
        }
        if (!_isSmartContractAddress(erc20Conctract)) {
            revert("_erc20Contract is not a contract");
        }
        _erc20Contract = erc20Conctract;
    }
    
    function mintTo(address _to, uint256 _tokenAmount) external{
        _isOwnerProtocol(msg.sender);
        _isZeroAddress(_to, '_to');
        if (_blacklistAddress[_to]) {
            revert("_to address is in blacklist");
        }
        _isZeroValue(_tokenAmount, '_tokenAmount');
        uint256 totalSupply =   totalSupplyTokenContract(erc20Contract());
        if (totalSupply < _tokenAmount) {
            revert("_tokenAmount exceeds max supply");
        }
        mintTokenContract (_to, _tokenAmount,erc20Contract());
        emit MintOrder(_to, _tokenAmount);
    }

    function transferToEthereum(uint256 _tokenAmount) external{
        _isZeroValue(_tokenAmount, '_tokenAmount');
        uint256 tokenVaultAmount = balanceOfTokenContract(msg.sender, erc20Contract());
        if (tokenVaultAmount < _tokenAmount){
            revert("_tokenAmount value exceed balance");
        }
        burnTokenContract (_tokenAmount,erc20Contract());
        emit TransferToEthereum(msg.sender, _tokenAmount);
    }

    // /// ------------------------------------------------------------------------------------------------------------------------------------------
    // /// PRIVATE FUNCTIONS
    // /// ------------------------------------------------------------------------------------------------------------------------------------------
  
    function _isSmartContractAddress(address _address) private view returns (bool) {
         bytes32 zeroAccountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
         bytes32 codeHash;    
         assembly { codeHash := extcodehash(_address) }
         return (codeHash != zeroAccountHash && codeHash != 0x0);
     }

     function mintTokenContract(address _to, uint256 _tokenAmount, address _erc20Conctract) private{
        ITokenContractPolygon(_erc20Conctract).mint(_to, _tokenAmount);
    }

     function balanceOfTokenContract(address _from, address _erc20Conctract) private  view returns (uint256) {
            return ITokenContractPolygon(_erc20Conctract).balanceOf(_from);
    }

     function totalSupplyTokenContract(address _erc20Conctract) private  view returns (uint256) {
            return ITokenContractPolygon(_erc20Conctract).totalSupply();
    }

    function burnTokenContract(uint256 _tokenAmount, address _erc20Conctract) private{
        ITokenContractPolygon(_erc20Conctract).burn(_tokenAmount);
    }

}