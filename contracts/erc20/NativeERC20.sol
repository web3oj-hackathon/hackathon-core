// solhint-disable not-rely-on-time
// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "../interfaces/IPeggable.sol";
import "../interfaces/IExtendedERC20.sol";
import "../interfaces/INativeERC20Registry.sol";

/**
 * @title gas proxyable ERC20
 * @notice This contract implements ERC20 token that is pegged to ERC20 token and supports gas proxy.
 */
contract NativeERC20 is IPeggable, ERC20, ERC20Permit, ERC2771Recipient {
    INativeERC20Registry registry;

    // original ERC20 token address.
    IExtendedERC20 public erc20;

    constructor(address erc20_, INativeERC20Registry registry_)
        ERC20(
            string(abi.encodePacked("Native ", IERC20Metadata(erc20_).name())),
            string(abi.encodePacked("n", IERC20Metadata(erc20_).symbol()))
        )
        ERC20Permit("NativeERC20")
    {
        require(erc20_ != address(0), "NativeERC20: ZERO_ADDRESS");
        erc20 = IExtendedERC20(erc20_);
        registry = registry_;
        _setTrustedForwarder(registry_.forwarder());
    }

    /**
     * Returns decimals of token.
     * Its decimal is same as original ERC20 token.
     */
    function decimals() public view virtual override returns (uint8) {
        return erc20.decimals();
    }

    /**
     * Deposit `amount` tokens to this contract and mint pegged native ERC-20 tokens.
     * @param amount The amount to deposit.
     */
    function deposit(uint256 amount) external {
        _deposit(_msgSender(), amount);
    }

    /**
     * Claims `amount` tokens to this contract. It burns pegged native ERC-20 tokens
     * and sends original ERC20 tokens to `to`.
     *
     * @param to The address to withdraw to.
     * @param amount The amount to withdraw.
     */
    function withdraw(address to, uint256 amount) external {
        _withdraw(_msgSender(), to, amount);
    }

    /**
     * Move `amount` tokens from `from` to this contract and mint pegged native ERC-20 tokens.
     *
     * @param from The address to deposit from.
     * @param amount The amount to deposit.
     */
    function _deposit(address from, uint256 amount) internal {
        erc20.transferFrom(from, address(this), amount);
        _mint(from, amount);
    }

    /**
     * Move `amount` tokens from this contract to `to` and burn pegged native ERC-20 tokens in `from` address.
     *
     * @param from The address to claim from.
     * @param to The address to withdraw to.
     * @param amount The amount to withdraw.
     */
    function _withdraw(address from, address to, uint256 amount) internal {
        _burn(from, amount);
        erc20.transfer(to, amount);
    }

    function _msgSender() internal view override(Context, ERC2771Recipient) returns (address ret) {
        return ERC2771Recipient._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Recipient) returns (bytes calldata ret) {
        return ERC2771Recipient._msgData();
    }
}
