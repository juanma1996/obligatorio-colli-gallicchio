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

    /*
     * @notice Initialize the state of the contract
     * @dev Throw if `erc20Contract` is not a smart contract. Message: "erc20Contract is not a contract"
     * @param erc20Ethereum The address of ERC20 Ethereum Contract
     */
    constructor(address erc20Conctract) BridgeAbstract(){
        // Checks
        if (erc20Conctract == address(0)) {
            revert("erc20Conctract cannot be zero address");
        }

        // Effects
        _erc20Contract = erc20Conctract;
    }

    /*
     * @notice Transfer ethers from Ethereum to Polygon
     * @dev Throw if `_tokenAmount` is bigger than max supply value. Message: "_tokenAmount exceeds max supply"
     * @dev Throw if `_tokenAmount` is zero value. Message: "_tokenAmount must be greater than zero"
     * @dev Throw if `msg.sender` is in the black list. Message: "Invalid sender"
     * @dev Throw if `msg.sender` have not sufficient balance of tokens. Message: "Insufficient balance"
     * @param _tokenAmount. The amount of token to transfer to Polygon.
     */
    function transferToPolygon(uint256 _tokenAmount) external
    {   
        // Checks
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

        // Efects
        tokenStaking[msg.sender] += _tokenAmount; 
     
        // Interactions 
        transferFromTokenContract(msg.sender, address(this), _tokenAmount, erc20Contract());
        emit TransferToPolygon(msg.sender, _tokenAmount);    
       
    }

    /*
     * @notice Unstake tokens
     * @dev Throw if msg.sender is not the owner of the protocol. Message: "Not authorized"
     * @dev Throw if `_owner` is zero address. Message: "_owner cannot be zero address"
     * @dev Throw if `_owner` is in the black list. Message: "_owner address is in blacklist"
     * @dev Throw if `_owner` have not tokens in stake. Message: "_owner address has no stake"
     * @dev Throw if `_tokenAmount` is zero value. Message: "_tokenAmount must be greater than zero"
     * @dev Throw if `_tokenAmount` is bigger that amount ok tokens in stake. Message: "“_tokenAmount value exceed staking"
     * @param _tokenAmount. The amount of token to transfer to Polygon.
     * @param _owner. The address of owner of tokens.
     */
    function unStake(address _owner, uint256 _tokenAmount) external
    {
        // Checks
        _isZeroAddress(_owner, '_owner');
        _isOwnerProtocol(msg.sender);
        
        if (_blacklistAddress[_owner]) {
            revert("_owner address is in blacklist");
        }
        _isZeroValue(_tokenAmount, '_tokenAmount');
        if (tokenStaking[_owner] == 0){
            revert("_owner address has no stake");
        }

        if (tokenStaking[_owner] < _tokenAmount){
            revert("_tokenAmount value exceed staking");
        }
       
       // Efects
        tokenStaking[_owner] -= _tokenAmount;

        // Interactions 
        transferTokenContract(_owner, _tokenAmount, erc20Contract());
    }

    // /// ------------------------------------------------------------------------------------------------------------------------------------------
    // /// PRIVATE FUNCTIONS
    // /// ------------------------------------------------------------------------------------------------------------------------------------------

    function balanceOfTokenContract(address _from, address _erc20Conctract) private  view returns (uint256) 
    {
            return ITokenContract(_erc20Conctract).balanceOf(_from);
    }

     function transferFromTokenContract(address _from, address _to, uint256 _value, address _erc20Conctract) private  
     {
            ITokenContract(_erc20Conctract).transferFrom(_from, _to,_value);
    }

    function transferTokenContract(address _to, uint256 _value, address _erc20Conctract) private  
    {
            ITokenContract(_erc20Conctract).transfer(_to,_value);
    }
}