// Token icon mapping utility
export const getTokenIcon = (tokenSymbol: string): string => {
  const symbol = tokenSymbol?.toUpperCase();
  console.log('getTokenIcon called with symbol:', symbol);
  
  let iconPath = '';
  switch (symbol) {
    case 'AAVE':
      iconPath = '/tokenicons/aave-aave-logo.png';
      break;
    case 'LINK':
      iconPath = '/tokenicons/chainlink-link-logo.png';
      break;
    case 'WBTC':
    case 'BTC':
      iconPath = '/tokenicons/bitcoin-btc-logo.png';
      break;
    case 'WETH':
    case 'ETH':
      iconPath = '/tokenicons/ethereum-eth-logo.png';
      break;
    case 'EURS':
      iconPath = '/tokenicons/stasis-euro-eurs-logo.png';
      break;
    case 'COMP':
      iconPath = '/tokenicons/compound-comp-logo.png';
      break;
    default:
      // Default to ETH icon for unknown tokens
      iconPath = '/tokenicons/ethereum-eth-logo.png';
      break;
  }
  
  console.log('getTokenIcon returning path:', iconPath);
  return iconPath;
};

// Get token symbol from strategy name and token address
export const getTokenSymbol = (strategyName: string, tokenAddress?: string, chainId?: string): string => {
  console.log('getTokenSymbol called with:', { strategyName, tokenAddress, chainId });
  
  // First try to get symbol from token address if available
  if (tokenAddress && chainId) {
    try {
      // Import addresses dynamically to avoid SSR issues
      const addresses = require('../../../constants/addresses.json');
      const chainAddresses = addresses[chainId as keyof typeof addresses] as any;
      
      if (chainAddresses?.aaveV3?.assets) {
        for (const [symbol, asset] of Object.entries(chainAddresses.aaveV3.assets)) {
          const assetData = asset as any;
          if (assetData.UNDERLYING.toLowerCase() === tokenAddress.toLowerCase()) {
            console.log('Found token symbol from address:', symbol);
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
  console.log('Parsing strategy name:', nameLower);
  
  if (nameLower.includes('link')) {
    console.log('Found LINK in name');
    return 'LINK';
  }
  if (nameLower.includes('weth')) {
    console.log('Found WETH in name');
    return 'WETH';
  }
  if (nameLower.includes('usdc')) {
    console.log('Found USDC in name');
    return 'USDC';
  }
  if (nameLower.includes('wbtc')) {
    console.log('Found WBTC in name');
    return 'WBTC';
  }
  if (nameLower.includes('aave')) {
    console.log('Found AAVE in name');
    return 'AAVE';
  }
  if (nameLower.includes('eurs')) {
    console.log('Found EURS in name');
    return 'EURS';
  }
  if (nameLower.includes('dai')) {
    console.log('Found DAI in name');
    return 'DAI';
  }
  if (nameLower.includes('usdt')) {
    console.log('Found USDT in name');
    return 'USDT';
  }
  if (nameLower.includes('comp')) {
    console.log('Found COMP in name');
    return 'COMP';
  }
  
  console.log('Defaulting to ETH');
  return 'ETH';
}; 