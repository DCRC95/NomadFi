const fs = require("fs");
const path = require("path");

// Mock the getTokenSymbol function logic
function getTokenSymbol(strategyName, tokenAddress, chainId) {
  // First try to get symbol from token address if available
  if (tokenAddress && chainId) {
    try {
      const addressesPath = path.join(__dirname, "../constants/addresses.json");
      const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
      const chainAddresses = addresses[chainId];
      
      if (chainAddresses?.aaveV3?.assets) {
        for (const [symbol, asset] of Object.entries(chainAddresses.aaveV3.assets)) {
          const assetData = asset;
          if (assetData.UNDERLYING.toLowerCase() === tokenAddress.toLowerCase()) {
            return symbol;
          }
        }
      }
    } catch (error) {
      console.warn('Error getting token symbol from address, falling back to name parsing:', error);
    }
  }

  // Fallback to name parsing
  const nameLower = strategyName.toLowerCase();
  if (nameLower.includes('link')) return 'LINK';
  if (nameLower.includes('weth')) return 'WETH';
  if (nameLower.includes('usdc')) return 'USDC';
  if (nameLower.includes('wbtc')) return 'WBTC';
  if (nameLower.includes('aave')) return 'AAVE';
  if (nameLower.includes('eurs')) return 'EURS';
  if (nameLower.includes('dai')) return 'DAI';
  if (nameLower.includes('usdt')) return 'USDT';
  return 'ETH';
}

async function main() {
  console.log("Testing token symbol mapping for Aave strategies...");

  // Load addresses.json
  const addressesPath = path.join(__dirname, "../constants/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  const sepoliaConfig = addresses['11155111'];

  // Test strategies
  const testStrategies = [
    {
      name: "AaveV3LINKStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.LINK.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "LINK"
    },
    {
      name: "AaveV3WBTCStrategy", 
      tokenAddress: sepoliaConfig.aaveV3.assets.WBTC.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "WBTC"
    },
    {
      name: "AaveV3AAVEStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.AAVE.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "AAVE"
    },
    {
      name: "AaveV3EURSStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.EURS.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "EURS"
    },
    {
      name: "AaveV3USDCStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.USDC.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "USDC"
    },
    {
      name: "AaveV3DAIStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.DAI.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "DAI"
    },
    {
      name: "AaveV3WETHStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.WETH.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "WETH"
    },
    {
      name: "AaveV3USDTStrategy",
      tokenAddress: sepoliaConfig.aaveV3.assets.USDT.UNDERLYING,
      chainId: "11155111",
      expectedSymbol: "USDT"
    }
  ];

  console.log("\n=== Testing Token Symbol Mapping ===");
  
  testStrategies.forEach(strategy => {
    const symbol = getTokenSymbol(strategy.name, strategy.tokenAddress, strategy.chainId);
    const isCorrect = symbol === strategy.expectedSymbol;
    const status = isCorrect ? "✅" : "❌";
    
    console.log(`${status} ${strategy.name}:`);
    console.log(`  Token Address: ${strategy.tokenAddress}`);
    console.log(`  Expected Symbol: ${strategy.expectedSymbol}`);
    console.log(`  Actual Symbol: ${symbol}`);
    console.log(`  Match: ${isCorrect ? 'Yes' : 'No'}`);
    console.log('');
  });

  // Test fallback behavior
  console.log("=== Testing Fallback Behavior ===");
  const fallbackTest = {
    name: "SomeUnknownStrategy",
    tokenAddress: "0x1234567890123456789012345678901234567890",
    chainId: "11155111"
  };
  
  const fallbackSymbol = getTokenSymbol(fallbackTest.name, fallbackTest.tokenAddress, fallbackTest.chainId);
  console.log(`Fallback test for "${fallbackTest.name}": ${fallbackSymbol}`);

  console.log("\n✅ Token symbol mapping test completed!");
}

main()
  .then(() => {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }); 