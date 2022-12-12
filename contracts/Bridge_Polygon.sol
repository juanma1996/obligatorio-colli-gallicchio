// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "hardhat/console.sol";
import "./BridgeAbstract.sol";
import "./interfaces/ITokenContractPolygon.sol";

contract Bridge_Polygon is BridgeAbstract 
{
    /// EVENTS
    /// @notice Trigger when tokens need to be burn on ERC-20 contract
    /// @dev Trigger with the `from` address and token amount
    event TransferToEthereum(address indexed _to, uint256 _tokenAmount);

    /// @notice Trigger when tokens are minted on Polygon
    /// @dev Trigger with the `to` address and token amount
    event MintOrder(address indexed _to, uint256 _tokenAmount);

    /*
     * @notice Initialize the state of the contract
     * @dev Throw if `erc20Polygon` is not a smart contract. Message: "_erc20Contract is not a contract"
     * @dev Throw if `erc20Polygon` is zero address. Message: "Invalid address _erc20Contract"
     * @param erc20Ethereum The address of ERC20 Ethereum Contract
     */
    constructor(address erc20Polygon) BridgeAbstract(){
         // Checks
         if (erc20Polygon == address(0)) {
            revert("Invalid address _erc20Contract");
        }
        if (!_isSmartContractAddress(erc20Polygon)) {
            revert("_erc20Contract is not a contract");
        }

         // Effects
        _erc20Contract = erc20Polygon;
    }
    
    /*
     * @notice Mint tokens in ERC20 of Polygon
     * @dev Throw if msg.sender is not the owner of the protocol. Message: "Not authorized"
     * @dev Throw if `_to` is zero address. Message: "_to cannot be zero address"
     * @dev Throw if `_to` is in the black list. Message: "_to address is in blacklist"
     * @dev Throw if `_tokenAmount` is zero value. Message: "_tokenAmount must be greater than zero"
     * @dev Throw if `_tokenAmount` is bigger than max supply value. Message: "_tokenAmount exceeds max supply"
     * @param _tokenAmount. The amount of token to Mint.
     * @param _to. The address of owner of tokens.
     */
    function mintTo(address _to, uint256 _tokenAmount) external
    {
         // Checks
         _isOwnerProtocol(msg.sender);
        if (_blacklistAddress[_to]) {
            revert("_to address is in blacklist");
        }
         _isZeroAddress(_to, '_to');
        _isZeroValue(_tokenAmount, '_tokenAmount');
         _exceedsMaxSupply(_tokenAmount);

        // Interactions 
        mintTokenContract (_to, _tokenAmount,erc20Contract());
        emit MintOrder(_to, _tokenAmount);
    }

     /*
     * @notice Transfer ethers from Polygon to Ethereum 
     * @dev Throw if `_tokenAmount` is bigger than the balance of tokens of the sender. Message: "_tokenAmount value exceed balance"
     * @dev Throw if `_tokenAmount` is zero value. Message: "_tokenAmount must be greater than zero"
     * @param _tokenAmount. The amount of token to transfer to Ethereum.
     */
    function transferToEthereum(uint256 _tokenAmount) external
    {
        // Checks
        _isZeroValue(_tokenAmount, '_tokenAmount');
       
        uint256 tokenRecipientAmount = balanceOfTokenContract(msg.sender, erc20Contract());
        if (tokenRecipientAmount < _tokenAmount){
            revert("_tokenAmount value exceed balance");
        }
        // Interactions 
        transferFromTokenContract(msg.sender, address(this), _tokenAmount, erc20Contract());
        burnTokenContract (_tokenAmount,erc20Contract());
        emit TransferToEthereum(msg.sender, _tokenAmount);
    }

    // /// ------------------------------------------------------------------------------------------------------------------------------------------
    // /// PRIVATE FUNCTIONS
    // /// ------------------------------------------------------------------------------------------------------------------------------------------
  
    function _isSmartContractAddress(address _address) private view returns (bool) 
    {
         bytes32 zeroAccountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
         bytes32 codeHash;    
         assembly { codeHash := extcodehash(_address) }
         return (codeHash != zeroAccountHash && codeHash != 0x0);
     }

     function mintTokenContract(address _to, uint256 _tokenAmount, address _erc20Polygon) private
     {
        ITokenContractPolygon(_erc20Polygon).mint(_to, _tokenAmount);
    }

     function balanceOfTokenContract(address _from, address _erc20Polygon) private  view returns (uint256) 
     {
            return ITokenContractPolygon(_erc20Polygon).balanceOf(_from);
    }

    function burnTokenContract(uint256 _tokenAmount, address _erc20Polygon) private
    {
        ITokenContractPolygon(_erc20Polygon).burn(_tokenAmount);
    }

    function transferFromTokenContract(address _from, address _to, uint256 _value, address _erc20Polygon) private  
    {
            ITokenContract(_erc20Polygon).transferFrom(_from, _to,_value);
    }

}