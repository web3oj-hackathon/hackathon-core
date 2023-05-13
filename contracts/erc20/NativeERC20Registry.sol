// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NativeETH.sol";
import "./NativeERC20.sol";
import "../interfaces/INativeERC20Registry.sol";

/**
 * @title Native ERC20 Registry
 * @notice This contract deploys NativeEther and NativeERC20 contracts and
 * keeps track of deployed NativeERC20 contracts.
 */
contract NativeERC20Registry is INativeERC20Registry, Ownable {
    NativeETH public nativeETH;
    mapping(address => NativeERC20) public nativeTokens;
    address public forwarder;

    constructor(address forwarder_) Ownable() {
        // deploy Native Ether contract.
        nativeETH = new NativeETH(INativeERC20Registry(this));
        forwarder = forwarder_;
    }

    /**
     * Creates NativeERC20 contract for the given ERC20 token.
     *
     * @param erc20_ original ERC20 token address.
     */
    function createNativeERC20(address erc20_) external onlyOwner returns (address) {
        require(erc20_ != address(0), "NativeERC20Registry: ZERO_ADDRESS");
        require(nativeTokens[erc20_] == NativeERC20(address(0)), "NativeERC20Registry: ALREADY_CREATED");
        return _createNativeERC20(erc20_);
    }

    function _createNativeERC20(address erc20_) internal returns (address) {
        // use CREATE2 to deploy NativeERC20 contract.
        // to use CREATE2, we expect NativeERC20 contract address even before deployment.
        NativeERC20 nativeToken = new NativeERC20{salt: bytes32(uint256(0))}(erc20_, INativeERC20Registry(this));

        // register NativeERC20 contract address.
        nativeTokens[erc20_] = nativeToken;

        return address(nativeToken);
    }

    function originalTokenOf(address nativeToken) external view returns (address) {
        return address(NativeERC20(nativeToken).erc20());
    }
}
