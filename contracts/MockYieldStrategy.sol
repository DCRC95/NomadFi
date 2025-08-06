// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockYieldStrategy {
    address public mockToken;
    mapping(address => uint256) public deposits;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor(address _mockToken) {
        mockToken = _mockToken;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        IERC20(mockToken).transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount;
        IERC20(mockToken).transfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function getAPY() external pure returns (uint256) {
        return 500; // 5% APY (500 basis points)
    }
} 