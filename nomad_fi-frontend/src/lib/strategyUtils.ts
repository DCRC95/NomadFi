// Strategy name parsing and formatting utilities
export const parseStrategyName = (strategyName: string): { token: string; type: string; protocol: string } => {
  const name = strategyName.toUpperCase();
  
  // Extract token name from strategy name
  let token = '';
  if (name.includes('LINK')) token = 'LINK';
  else if (name.includes('WETH')) token = 'WETH';
  else if (name.includes('USDC')) token = 'USDC';
  else if (name.includes('WBTC')) token = 'WBTC';
  else if (name.includes('AAVE')) token = 'AAVE';
  else if (name.includes('EURS')) token = 'EURS';
  else if (name.includes('DAI')) token = 'DAI';
  else if (name.includes('USDT')) token = 'USDT';
  else if (name.includes('CBETH')) token = 'cbETH';
  else if (name.includes('COMP')) token = 'COMP';
  else token = 'UNKNOWN';
  
  // Extract protocol
  let protocol = '';
  if (name.includes('AAVE')) protocol = 'AAVE';
  else if (name.includes('COMPOUND')) protocol = 'COMPOUND';
  else if (name.includes('MOCK')) protocol = 'MOCK';
  else protocol = 'UNKNOWN';
  
  return {
    token,
    type: 'STRATEGY',
    protocol
  };
};

export const formatStrategyDisplayName = (strategyName: string): { mainTitle: string; subtitle: string } => {
  const parsed = parseStrategyName(strategyName);
  
  return {
    mainTitle: `${parsed.token} ${parsed.type}`,
    subtitle: parsed.protocol
  };
}; 