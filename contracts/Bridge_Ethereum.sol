// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./BridgeAbstract.sol";
import "./interfaces/ITokenContract.sol";

contract Bridge_Ethereum is BridgeAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens are transfer to staking
    /// @dev Trigger with the `from` address and token amount
    event TransferToPolygon(address indexed _from, uint256 _tokenAmount);

    /// STATE MAPPINGS
    mapping(address => uint256) public tokenStaking;

    constructor(address erc20Conctract) BridgeAbstract(){
        
        if (erc20Conctract == address(0)) {
            revert("erc20Conctract cannot be zero address");
        }
        _erc20Contract = erc20Conctract;
    }

    function transferToPolygon(uint256 _tokenAmount) external{
        if (_tokenAmount == 0) {
            revert("_tokenAmount must be greater than zero");
        }
        
        _exceedsMaxSupply(_tokenAmount);

        if (_blacklistAddress[msg.sender]) {
            revert("Invalid sender");
        }

        uint256 tokenVaultAmount = balanceOfTokenContract(msg.sender, erc20Contract()); 
        if (tokenVaultAmount < _tokenAmount){
            revert("Insufficient balance");
        }

        tokenStaking[msg.sender] += _tokenAmount; 
     
        transferFromTokenContract(msg.sender, address(this), _tokenAmount, erc20Contract());
        emit TransferToPolygon(msg.sender, _tokenAmount);    
       
    }

    function unStake(address ownerAddress, uint256 _tokenAmount) external{
        _isZeroAddress(ownerAddress, '_owner');
        _isOwnerProtocol(msg.sender);
        
        if (_blacklistAddress[ownerAddress]) {
            revert("_owner address is in blacklist");
        }
        _isZeroValue(_tokenAmount, '_tokenAmount');
        if (tokenStaking[ownerAddress] == 0){
            revert("_owner address has no stake");
        }

        if (tokenStaking[ownerAddress] < _tokenAmount){
            revert("_tokenAmount value exceed staking");
        }
       
        tokenStaking[ownerAddress] -= _tokenAmount;
        transferTokenContract(ownerAddress, _tokenAmount, erc20Contract());
    }

    // /// ------------------------------------------------------------------------------------------------------------------------------------------
    // /// PRIVATE FUNCTIONS
    // /// ------------------------------------------------------------------------------------------------------------------------------------------

    function balanceOfTokenContract(address _from, address _erc20Conctract) private  view returns (uint256) {
            return ITokenContract(_erc20Conctract).balanceOf(_from);
    }

     function transferFromTokenContract(address _from, address _to, uint256 _value, address _erc20Conctract) private  {
            ITokenContract(_erc20Conctract).transferFrom(_from, _to,_value);
    }

    function transferTokenContract(address _to, uint256 _value, address _erc20Conctract) private  {
            ITokenContract(_erc20Conctract).transfer(_to,_value);
    }
}