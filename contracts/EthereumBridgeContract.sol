// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./BridgeContractAbstract.sol";
import "./interfaces/ITokenContract.sol";

contract EthereumBridgeContract is BridgeContractAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens are transfer to staking
    /// @dev Trigger with the `from` address and token amount
    event TransferToPolygon(address indexed _from, uint256 _tokenAmount);

    /// STATE VARIABLES
    //uint256 private _maxAmountTokenPerTransfer;
    uint256 private _maxSupplyToken;
    uint256 private _totalSupplyToken;

    /// STATE MAPPINGS
    mapping(address => uint256) public _tokenStaking;

    constructor(address erc20Conctract, uint256 maxSupplyToken) BridgeContractAbstract(erc20Conctract){
        _maxSupplyToken = maxSupplyToken;
    }

    function totalSupply() public view returns (uint256)
    {
        return _totalSupplyToken;
    }

    function maxSupply() public view returns (uint256)
    {
        return _maxSupplyToken;
    }

    function transferToPolygon(uint256 _tokenAmount) external{
        if (_tokenAmount == 0) {
            revert("_tokenAmount must be greater than zero");
        }
        
        if (_tokenAmount > _maxSupplyToken) {
            revert("_tokenAmount exceeds max supply");
        }

        if (_blacklistAddress[msg.sender]) {
            revert("Invalid sender");
        }

        uint256 tokenVaultAmount = balanceOfTokenContract(msg.sender, erc20Contract()); 
        if (tokenVaultAmount < _tokenAmount){
            revert("Insufficient balance");
        }

        _tokenStaking[msg.sender] += _tokenAmount; 
        _totalSupplyToken += _tokenAmount; 
        emit TransferToPolygon(msg.sender, _tokenAmount);    
        transferFromTokenContract(msg.sender, address(this), _tokenAmount, erc20Contract());
       
    }

    function unStake(address ownerAddress, uint256 _tokenAmount) external{
        _isZeroAddress(ownerAddress, '_owner');
        _isOwnerProtocol(msg.sender);
        
        if (_blacklistAddress[ownerAddress]) {
            revert("_owner address is in blacklist");
        }
        _isZeroValue(_tokenAmount, '_tokenAmount');
        if (_tokenStaking[ownerAddress] == 0){
            revert("_owner address has no stake");
        }

        if (_tokenStaking[ownerAddress] < _tokenAmount){
            revert("_tokenAmount value exceed staking");
        }
       
        _tokenStaking[ownerAddress] -= _tokenAmount;
        _totalSupplyToken -= _tokenAmount; 
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