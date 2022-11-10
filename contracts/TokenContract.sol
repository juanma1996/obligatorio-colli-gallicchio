// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


contract TokenContract {

    string public name = "";
    string public symbol = "";
    uint8 public decimals;
    uint256 public totalSupply;
    uint256 public maxSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
   
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _maxSupply)
    {
        name = _name;
        symbol = _symbol;
        decimals= _decimals;
        maxSupply = _maxSupply;
    }

}