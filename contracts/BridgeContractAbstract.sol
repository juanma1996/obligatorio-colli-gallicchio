// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


abstract contract BridgeContractAbstract {

    address private _owner;

    constructor()
    {
        _owner = msg.sender;
    }

    function owner() public virtual view returns (address){
        return _owner;
    }
}