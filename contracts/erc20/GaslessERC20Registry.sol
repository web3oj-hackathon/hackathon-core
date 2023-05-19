// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GaslessAVAX.sol";
import "./GaslessERC20.sol";
import "../interfaces/IGaslessERC20Registry.sol";

/**
 * @title Gasless ERC20 Registry
 * @notice This contract deploys GaslessAVAX and GaslessERC20 contracts and
 * keeps track of deployed GaslessERC20 contracts.
 */
contract GaslessERC20Registry is IGaslessERC20Registry, Ownable {
    GaslessAVAX public gaslessAVAX;
    mapping(address => GaslessERC20) public gaslessTokens;
    address public forwarder;

    constructor(address forwarder_) {
        forwarder = forwarder_;
    }

    /**
     * Proxies GaslessAVAX contract.
     *
     * @param gaslessAvax GaslessAVAX contract address.
     */
    function proxyGaslessAVAX(GaslessAVAX gaslessAvax) external {
        require(address(gaslessAVAX) == address(0), "GaslessERC20Registry: ALREADY_PROXIED");
        require(gaslessAvax.registry() == IGaslessERC20Registry(this), "GaslessERC20Registry: INVALID_REGISTRY");

        // to prevent too long code length,
        // deploy gaslessAVAX contract separately.
        gaslessAVAX = gaslessAvax;
    }

    /**
     * Creates GaslessERC20 contract for the given ERC20 token.
     *
     * @param erc20_ original ERC20 token address.
     */
    function createGaslessERC20(address erc20_) external returns (address) {
        require(erc20_ != address(0), "GaslessERC20Registry: ZERO_ADDRESS");
        return _createGaslessERC20(erc20_);
    }

    function _createGaslessERC20(address erc20_) internal returns (address) {
        require(gaslessTokens[erc20_] == GaslessERC20(address(0)), "GaslessERC20Registry: ALREADY_CREATED");

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
