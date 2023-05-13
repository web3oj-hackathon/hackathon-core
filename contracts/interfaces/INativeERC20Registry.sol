// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface INativeERC20Registry {
    function createNativeERC20(address erc20_) external returns (address);
    function originalTokenOf(address nativeToken) external view returns (address);
    function forwarder() external view returns (address);
}
