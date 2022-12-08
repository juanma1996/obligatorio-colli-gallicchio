// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "./TokenContractAbstract.sol";

contract TokenContractPolygon is TokenContractAbstract 
{
    constructor(string memory _name, string memory _symbol) TokenContractAbstract(_name, _symbol){} 
}