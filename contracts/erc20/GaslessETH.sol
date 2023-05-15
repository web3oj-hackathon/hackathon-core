// solhint-disable not-rely-on-time
// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "../interfaces/IPeggable.sol";
import "../interfaces/IExtendedERC20.sol";
import "../interfaces/IGaslessERC20Registry.sol";

/**
 * @title gas proxyable Gasless Token
 * @notice This contract implements ERC20 token that is pegged to Gasless token and supports gas proxy.
 */
contract GaslessETH is IEtherPeggable, ERC20, ERC20Permit, ERC2771Recipient {
    IGaslessERC20Registry public registry;

    constructor(IGaslessERC20Registry registry_) ERC20("Gasless Ether", "nETH") ERC20Permit("GaslessERC20") {
        registry = registry_;
        _setTrustedForwarder(registry_.forwarder());
    }

    /**
     * Deposit `msg.value` tokens to this contract and mint pegged gasless ERC-20 tokens.
     */
    function deposit() external payable {
        _deposit(_msgSender(), msg.value);
    }

    /**
     * Claims `amount` tokens to this contract. It burns pegged gasless ERC-20 tokens
     * and sends original ERC20 tokens to `to`.
     *
     * @param to The address to withdraw to.
     * @param amount The amount to withdraw.
     */
    function withdraw(address to, uint256 amount) external {
        _withdraw(_msgSender(), payable(to), amount);
    }

    /**
     * Withdraw `amount` tokens to this contract and mint pegged gasless ERC-20 tokens.
     *
     * @param from The address to dep from.
     * @param amount The amount to withdraw.
     */
    function _deposit(address from, uint256 amount) internal {
        _mint(from, amount);
    }

    /**
     * Move `amount` tokens from this contract to `to` and burn pegged gasless ERC-20 tokens in `from` address.
     *
     * @param from The address to claim from.
     * @param to The address to withdraw to.
     * @param amount The amount to withdraw.
     */
    function _withdraw(address from, address payable to, uint256 amount) internal {
        _burn(from, amount);
        (bool success,) = to.call{value: amount}("");
        require(success, "GaslessETH: ETH_TRANSFER_FAILED");
    }

    function _msgSender() internal view override(Context, ERC2771Recipient) returns (address ret) {
        return ERC2771Recipient._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Recipient) returns (bytes calldata ret) {
        return ERC2771Recipient._msgData();
    }

    receive() external payable {
        _deposit(_msgSender(), msg.value);
    }
}
