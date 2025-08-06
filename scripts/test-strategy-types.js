const fetch = require('node-fetch');

async function testStrategyTypes() {
  console.log("Testing strategy types from API...");
  
  try {
    const response = await fetch('http://localhost:3001/api/strategies');
    const strategies = await response.json();
    
    console.log(`\nFound ${strategies.length} strategies:`);
    
    strategies.forEach((strategy, index) => {
      console.log(`\n${index + 1}. ${strategy.name}`);
      console.log(`   Strategy Type: ${strategy.strategyType} (${typeof strategy.strategyType})`);
      console.log(`   Is Aave (type === 1): ${Number(strategy.strategyType) === 1}`);
      console.log(`   Token Address: ${strategy.tokenAddress}`);
      console.log(`   Chain ID: ${strategy.chainId}`);
    });
    
    // Check EURS specifically
    const eursStrategy = strategies.find(s => s.name.includes('EURS'));
    if (eursStrategy) {
      console.log(`\n=== EURS Strategy Details ===`);
      console.log(`Name: ${eursStrategy.name}`);
      console.log(`Strategy Type: ${eursStrategy.strategyType} (${typeof eursStrategy.strategyType})`);
      console.log(`Is Aave: ${Number(eursStrategy.strategyType) === 1}`);
      console.log(`Will use AaveAPYBadge: ${Number(eursStrategy.strategyType) === 1}`);
    } else {
      console.log(`\n❌ EURS strategy not found in API response`);
    }
    
  } catch (error) {
    console.error("Error testing strategy types:", error);
  }
}

testStrategyTypes(); 