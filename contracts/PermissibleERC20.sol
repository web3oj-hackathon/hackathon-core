// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";

contract PermissibleERC20 is ERC20, Ownable, ERC20Permit, ERC2771Recipient {

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) ERC20Permit(name_) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _msgSender() internal override(Context, ERC2771Recipient) virtual view returns (address ret) {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            assembly {
                ret := shr(96,calldataload(sub(calldatasize(),20)))
            }
        } else {
            ret = msg.sender;
        }
    }

    /// @inheritdoc IERC2771Recipient
    function _msgData() internal override(Context, ERC2771Recipient) virtual view returns (bytes calldata ret) {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            return msg.data[0:msg.data.length-20];
        } else {
            return msg.data;
        }
    }

    function setTrustedForwarder(address _forwarder) public onlyOwner {
        _setTrustedForwarder(_forwarder);
    }
}
