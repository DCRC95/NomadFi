// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAAVEYieldStrategy {
    function depositToProtocol(uint256 amount) external returns (bool success);
    function withdrawFromProtocol(uint256 amount, address to) external returns (bool success);
    function apy() external view returns (uint256);
    function getCurrentBalance() external view returns (uint256);
} 