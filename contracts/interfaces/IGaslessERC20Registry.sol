// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IGaslessERC20Registry {
    function createGaslessERC20(address erc20_) external returns (address);
    function originalTokenOf(address gaslessToken) external view returns (address);
    function forwarder() external view returns (address);
}
