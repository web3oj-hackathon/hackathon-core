// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC20 for testing
 * @notice this contract is for testing.
 */
contract DevERC20 is ERC20, ERC20Permit, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
