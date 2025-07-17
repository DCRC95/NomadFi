// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAaveV3LendingPoolAddressesProvider {
    function getPool() external view returns (address);
    function getPoolDataProvider() external view returns (address);
} 