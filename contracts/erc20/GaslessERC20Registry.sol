// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GaslessETH.sol";
import "./GaslessERC20.sol";
import "../interfaces/IGaslessERC20Registry.sol";

/**
 * @title Gasless ERC20 Registry
 * @notice This contract deploys GaslessEther and GaslessERC20 contracts and
 * keeps track of deployed GaslessERC20 contracts.
 */
contract GaslessERC20Registry is IGaslessERC20Registry, Ownable {
    GaslessETH public gaslessETH;
    mapping(address => GaslessERC20) public gaslessTokens;
    address public forwarder;

    constructor(address forwarder_) Ownable() {
        // deploy Gasless Ether contract.
        gaslessETH = new GaslessETH(IGaslessERC20Registry(this));
        forwarder = forwarder_;
    }

    /**
     * Creates GaslessERC20 contract for the given ERC20 token.
     *
     * @param erc20_ original ERC20 token address.
     */
    function createGaslessERC20(address erc20_) external onlyOwner returns (address) {
        require(erc20_ != address(0), "GaslessERC20Registry: ZERO_ADDRESS");
        require(gaslessTokens[erc20_] == GaslessERC20(address(0)), "GaslessERC20Registry: ALREADY_CREATED");
        return _createGaslessERC20(erc20_);
    }

    function _createGaslessERC20(address erc20_) internal returns (address) {
        // use CREATE2 to deploy GaslessERC20 contract.
        // to use CREATE2, we expect GaslessERC20 contract address even before deployment.
        GaslessERC20 gaslessToken = new GaslessERC20{salt: bytes32(uint256(0))}(erc20_, IGaslessERC20Registry(this));

        // register GaslessERC20 contract address.
        gaslessTokens[erc20_] = gaslessToken;

        return address(gaslessToken);
    }

    function originalTokenOf(address gaslessToken) external view returns (address) {
        return address(GaslessERC20(gaslessToken).erc20());
    }
}
