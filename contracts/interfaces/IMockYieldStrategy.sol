// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMockYieldStrategy {
    function getAPY() external view returns (uint256);
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getCurrentBalance() external view returns (uint256);
} 