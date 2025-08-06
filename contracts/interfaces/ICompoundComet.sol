// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICompoundComet {
    function supply(address asset, uint256 amount) external returns (uint256);
    function withdraw(address asset, uint256 amount) external returns (uint256);
    function getSupplyRate(address asset) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function baseToken() external view returns (address);
    function getBorrowRate(address asset) external view returns (uint256);
} 