//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface ITokenContract {
    function transferFrom(address _from, address _to, uint256 _value) external;
    function balanceOf(address _from)  external view returns (uint256) ;
    function decimals()  external view returns (uint256) ;
    function transfer(address _to, uint256 _value) external;
    function totalSupply() external view returns (uint256);
    function allowance(address _owner, address _spender) external view returns (uint256);
}