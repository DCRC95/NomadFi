const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Constants
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60; // 31536000 seconds

// Helper function to convert Ray to decimal
function rayToDecimal(rayValue) {
  return Number(rayValue.toString()) / 1e27;
}

// Helper to recursively convert BigInt to string
function convertBigIntsToStrings(obj) {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings);
  } else if (typeof obj === 'object' && obj !== null) {
    const res = {};
    for (const key in obj) {
      res[key] = convertBigIntsToStrings(obj[key]);
    }
    return res;
  }
  return obj;
}

async function main() {
  console.log("Testing comprehensive LINK APY data fetching...");
  
  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  // Get addresses from the configuration
  const PROTOCOL_DATA_PROVIDER = addresses["11155111"].aaveV3?.core?.AAVE_PROTOCOL_DATA_PROVIDER;
  const LINK_ADDRESS = addresses["11155111"].aaveV3?.assets?.LINK?.UNDERLYING;
  const LINK_A_TOKEN = addresses["11155111"].aaveV3?.assets?.LINK?.A_TOKEN;
  const PRICE_ORACLE = addresses["11155111"].aaveV3?.core?.ORACLE;
  const INCENTIVES_CONTROLLER = addresses["11155111"].aaveV3?.core?.DEFAULT_INCENTIVES_CONTROLLER;
  
  if (!PROTOCOL_DATA_PROVIDER) {
    throw new Error('Aave Protocol Data Provider address not found');
  }
  
  if (!LINK_ADDRESS) {
    throw new Error('LINK token address not found');
  }
  
  console.log(`Protocol Data Provider: ${PROTOCOL_DATA_PROVIDER}`);
  console.log(`LINK Token Address: ${LINK_ADDRESS}`);
  console.log(`LINK A-Token Address: ${LINK_A_TOKEN}`);
  console.log(`Price Oracle: ${PRICE_ORACLE}`);
  console.log(`Incentives Controller: ${INCENTIVES_CONTROLLER}`);
  
  // ABI definitions
  const protocolDataProviderABI = [
    "function getReserveData(address asset) external view returns (uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint40 lastUpdateTimestamp)"
  ];
  
  const linkTokenABI = [
    "function decimals() external view returns (uint8)"
  ];
  
  const priceOracleABI = [
    "function getAssetPrice(address asset) external view returns (uint256)"
  ];
  
  const incentivesControllerABI = [
    "function getRewardsData(address asset, address reward) external view returns (uint256 emissionPerSecond, uint256 index, uint256 lastUpdateTimestamp)"
  ];
  
  try {
    // Create contract instances
    const protocolDataProviderContract = new hre.ethers.Contract(PROTOCOL_DATA_PROVIDER, protocolDataProviderABI, hre.ethers.provider);
    const linkTokenContract = new hre.ethers.Contract(LINK_ADDRESS, linkTokenABI, hre.ethers.provider);
    const priceOracleContract = new hre.ethers.Contract(PRICE_ORACLE, priceOracleABI, hre.ethers.provider);
    const incentivesControllerContract = new hre.ethers.Contract(INCENTIVES_CONTROLLER, incentivesControllerABI, hre.ethers.provider);
    
    console.log("\n=== Testing getLinkSupplyAPY ===");
    const linkSupplyData = await getLinkSupplyAPY(protocolDataProviderContract, linkTokenContract, priceOracleContract, LINK_ADDRESS);
    console.log("Link Supply Data:", JSON.stringify(convertBigIntsToStrings(linkSupplyData), null, 2));
    
    console.log("\n=== Testing getAaveIncentivesForLink ===");
    const incentivesData = await getAaveIncentivesForLink(protocolDataProviderContract, incentivesControllerContract, linkSupplyData.totalTVL_USD, LINK_ADDRESS);
    console.log("Incentives Data:", JSON.stringify(convertBigIntsToStrings(incentivesData), null, 2));
    
    console.log("\n=== Testing getLinkTotalAPY ===");
    const totalAPYData = await getLinkTotalAPY(linkSupplyData, incentivesData);
    console.log("Total APY Data:", JSON.stringify(convertBigIntsToStrings(totalAPYData), null, 2));
    
  } catch (error) {
    console.error("Error in main function:", error);
    throw error;
  }
}

async function getLinkSupplyAPY(protocolDataProviderContract, linkTokenContract, priceOracleContract, linkAddress) {
  try {
    console.log("Fetching LINK reserve data...");
    
    // Get reserve data for LINK
    const reserveData = await protocolDataProviderContract.getReserveData(linkAddress);

    // liquidityRate: The current annual supply rate for the reserve, in RAY units.
    const liquidityRateRay = reserveData.liquidityRate;
    const currentLinkSupplyAPR = rayToDecimal(liquidityRateRay); // This is an APR in decimal (e.g., 0.05 for 5%)

    console.log(`LINK Raw Liquidity Rate (RAY): ${liquidityRateRay.toString()}`);
    console.log(`LINK Supply APR (decimal): ${currentLinkSupplyAPR}`);

    // Get LINK decimals
    const linkDecimals = await linkTokenContract.decimals();
    console.log(`LINK Decimals: ${linkDecimals}`);

    // Get LINK price in USD
    console.log("Fetching LINK price...");
    const linkPriceRaw = await priceOracleContract.getAssetPrice(linkAddress);
    // Aave's PriceOracle usually returns prices scaled to 8 decimals for Chainlink feeds
    const linkPriceUSD = Number(linkPriceRaw) / (10**8); // Adjust based on your oracle's decimals
    console.log(`LINK Price Raw: ${linkPriceRaw.toString()}`);
    console.log(`LINK Price USD: ${linkPriceUSD}`);

    // Calculate total TVL (using available liquidity as proxy for total supplied)
    const availableLiquidity = BigInt(reserveData.availableLiquidity.toString());
    const decimalsDivisor = BigInt(10) ** BigInt(linkDecimals);
    const totalLinkSupplied = Number(availableLiquidity) / Number(decimalsDivisor);
    const totalTVL_USD = totalLinkSupplied * linkPriceUSD;

    console.log(`Total LINK Supplied: ${totalLinkSupplied}`);
    console.log(`Total TVL USD: ${totalTVL_USD}`);

    return {
      baseAPR: currentLinkSupplyAPR,
      totalTVL_USD: totalTVL_USD,
      linkPriceUSD: linkPriceUSD,
      linkDecimals: linkDecimals,
      rawLiquidityRateRay: liquidityRateRay.toString(),
      totalLinkSupplied: totalLinkSupplied,
      availableLiquidity: availableLiquidity.toString()
    };

  } catch (error) {
    console.error("Error fetching Aave LINK reserve data:", error);
    throw error;
  }
}

async function getAaveIncentivesForLink(protocolDataProviderContract, incentivesControllerContract, totalTVL_USD, linkAddress) {
  try {
    console.log("Fetching Aave incentives for LINK...");
    
    // Get aToken address from addresses.json instead
    const addressesPath = path.join(__dirname, "../constants/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const aLinkTokenAddress = addresses["11155111"].aaveV3?.assets?.LINK?.A_TOKEN;
    console.log(`aLINK Token Address: ${aLinkTokenAddress}`);

    // For Aave V3, we need to check if there are rewards
    // Let's try to get rewards data (this might not work on Sepolia)
    try {
      // Note: This might fail on Sepolia as rewards might not be configured
      const rewardsData = await incentivesControllerContract.getRewardsData(aLinkTokenAddress, aLinkTokenAddress);
      console.log("Rewards Data:", rewardsData);
      
      const emissionPerSecond = Number(rewardsData.emissionPerSecond) / (10**18); // AAVE has 18 decimals
      
      // For now, let's assume AAVE price is around $100 (you'd need to fetch this)
      const rewardTokenPriceUSD = 100; // Placeholder
      
      const totalAnnualRewardsInToken = emissionPerSecond * SECONDS_PER_YEAR;
      const totalAnnualRewardsInUSD = totalAnnualRewardsInToken * rewardTokenPriceUSD;

      if (totalTVL_USD === 0) {
        return { rewardAPR: 0, rewardsPerYearUSD: 0, rewardTokenPriceUSD: rewardTokenPriceUSD };
      }

      const rewardAPR = totalAnnualRewardsInUSD / totalTVL_USD;

      return {
        rewardAPR: rewardAPR,
        rewardsPerYearUSD: totalAnnualRewardsInUSD,
        rewardTokenPriceUSD: rewardTokenPriceUSD,
        emissionPerSecond: emissionPerSecond
      };
    } catch (rewardsError) {
      console.log("No rewards configured or error fetching rewards:", rewardsError.message);
      return {
        rewardAPR: 0,
        rewardsPerYearUSD: 0,
        rewardTokenPriceUSD: 0,
        emissionPerSecond: 0
      };
    }

  } catch (error) {
    console.error("Error fetching Aave LINK incentives data:", error);
    throw error;
  }
}

async function getLinkTotalAPY(linkSupplyData, incentivesData) {
  try {
    const { baseAPR, totalTVL_USD, linkPriceUSD } = linkSupplyData;
    const { rewardAPR, rewardsPerYearUSD } = incentivesData;

    const totalAPR = baseAPR + rewardAPR;

    // Compounding frequency: hourly (8760 times a year) for high APY
    const N = 8760; // Hourly compounding
    const apy = (Math.pow(1 + totalAPR / N, N) - 1) * 100; // Convert to percentage

    return {
      asset: 'LINK',
      chain: 'sepolia',
      protocol: 'Aave V3',
      currentAPY: parseFloat(apy.toFixed(4)),
      totalTVL_USD: parseFloat(totalTVL_USD.toFixed(2)),
      details: {
        baseAPR_percent: parseFloat((baseAPR * 100).toFixed(4)),
        rewardAPR_percent: parseFloat((rewardAPR * 100).toFixed(4)),
        rewardsPerYearUSD: parseFloat(rewardsPerYearUSD.toFixed(2)),
        linkPriceUSD: parseFloat(linkPriceUSD.toFixed(2)),
      }
    };
  } catch (error) {
    console.error("Error calculating total APY:", error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Comprehensive LINK APY test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Comprehensive LINK APY test failed:", error);
      process.exit(1);
    });
} 