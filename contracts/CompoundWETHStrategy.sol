// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/ICompoundComet.sol";
import "./interfaces/ICompoundYieldStrategy.sol";

contract CompoundWETHStrategy is ICompoundYieldStrategy {
    using SafeERC20 for IERC20;

    ICompoundComet public immutable compoundComet;
    IERC20 public immutable underlyingToken;
    
    uint256 public constant SECONDS_PER_YEAR = 31536000;

    constructor(address _compoundWETHComet, address _wethToken) {
        require(_compoundWETHComet != address(0), "CompoundWETHStrategy: zero comet address");
        require(_wethToken != address(0), "CompoundWETHStrategy: zero token address");
        
        compoundComet = ICompoundComet(_compoundWETHComet);
        underlyingToken = IERC20(_wethToken);
        
        // Verify the base token matches
        require(compoundComet.baseToken() == _wethToken, "CompoundWETHStrategy: base token mismatch");
    }

    function depositToProtocol(uint256 amount) external returns (bool success) {
        require(amount > 0, "CompoundWETHStrategy: amount must be greater than 0");
        
        // Approve the compound comet to spend the underlying token
        underlyingToken.approve(address(compoundComet), type(uint256).max);
        
        // Supply the underlying token to the compound comet
        uint256 errorCode = compoundComet.supply(address(underlyingToken), amount);
        require(errorCode == 0, string.concat("CompoundWETHStrategy: supply failed with error code ", Strings.toString(errorCode)));
        
        return true;
    }

    function withdrawFromProtocol(uint256 amount, address to) external returns (bool success) {
        require(amount > 0 || amount == type(uint256).max, "CompoundWETHStrategy: invalid amount");
        require(to != address(0), "CompoundWETHStrategy: zero address");
        
        // Withdraw the underlying token from the compound comet
        uint256 errorCode = compoundComet.withdraw(address(underlyingToken), amount);
        require(errorCode == 0, string.concat("CompoundWETHStrategy: withdraw failed with error code ", Strings.toString(errorCode)));
        
        return true;
    }

    function getCurrentBalance() external view returns (uint256) {
        return compoundComet.balanceOf(address(this));
    }

    function apy() external view returns (uint256) {
        uint256 supplyRatePerSecond = compoundComet.getSupplyRate(address(underlyingToken));
        uint256 annualRate = supplyRatePerSecond * SECONDS_PER_YEAR;
        return annualRate;
    }
} 