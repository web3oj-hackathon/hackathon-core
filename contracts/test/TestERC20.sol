// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC20 for testing
 * @notice this contract is for testing.
 */
contract TestERC20 is ERC20, Ownable {
    constructor() ERC20("TestERC20", "TEST") {
        _mint(msg.sender, 10000000 ether);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
