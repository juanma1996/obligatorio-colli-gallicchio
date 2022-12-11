//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface ITokenContractPolygon {
    function mint(address _to, uint256 _tokenAmount) external;
    function burn(address _from, uint256 _tokenAmount) external;
    function balanceOf(address _from)  external view returns (uint256);
}