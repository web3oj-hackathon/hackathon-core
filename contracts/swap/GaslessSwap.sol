// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.7.6;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "../interfaces/IPeggable.sol";

/**
 * @title GaslessSwap
 * @notice This contract make users swap gasless ERC20 tokens
 * to another gasless ERC20 tokens from Uniswap with no gas fee.
 */
contract GaslessSwap is ERC2771Recipient {
    ISwapRouter public immutable swapRouter;
    IGaslessERC20Registry public immutable registry;

    uint24 public constant poolFee = 3000;

    constructor(ISwapRouter _swapRouter, IGaslessERC20Registry registry_) {
        swapRouter = _swapRouter;
        registry = registry_;
    }

    /**
     * Swap gasless ERC20 tokens to another gasless ERC20 tokens from Uniswap
     * with no gas fee.
     *
     * @param from gasless in ERC20 token address
     * @param to gasless out ERC20 token address
     * @param amount The amount to swap (from amount)
     */
    function swap(IPeggable from, IPeggable to, uint256 amount) external {
        // get original ERC20 token address
        IERC20 fromToken = registry.originalTokenOf(address(from));
        IERC20 toToken = registry.originalTokenOf(address(to));

        // transfer gasless ERC20 tokens to this contract
        IERC20(address(from)).transferFrom(_msgSender(), address(this), amount);

        // convert gasless ERC20 tokens to original ERC20 tokens
        from.withdraw(address(this), amount);

        // swap original ERC20 tokens to another original ERC20 tokens
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: fromToken,
            tokenOut: toToken,
            fee: poolFee,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);

        // convert original ERC20 tokens to gasless ERC20 tokens
        to.deposit(amountOut);

        // transfer gasless ERC20 tokens to the sender
        IERC20(address(to)).transfer(_msgSender(), amountOut);
    }
}
