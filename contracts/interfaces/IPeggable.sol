// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";

interface IPeggable {
    function deposit(uint256 amount) external;
    function withdraw(address to, uint256 amount) external;
}

interface IEtherPeggable {
    function deposit() external payable;
    function withdraw(address to, uint256 amount) external;
}
