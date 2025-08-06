import addresses from '../../../constants/addresses.json';

export interface AddressesConfig {
  [chainId: string]: {
    networkName: string;
    deployedContracts?: {
      [contractName: string]: string;
    };
    aaveV3?: {
      core: {
        [key: string]: string;
      };
      assets: {
        [tokenName: string]: {
          UNDERLYING: string;
          DECIMALS: number;
          A_TOKEN: string;
          V_TOKEN: string;
          ORACLE: string;
          INTEREST_RATE_STRATEGY: string;
          STATIC_A_TOKEN?: string;
        };
      };
    };
  };
}

export const getContractAddress = (chainId: number, contractName: string): string | undefined => {
  const chainIdStr = chainId.toString();
  const chainConfig = (addresses as AddressesConfig)[chainIdStr];
  
  if (!chainConfig?.deployedContracts) {
    return undefined;
  }
  
  return chainConfig.deployedContracts[contractName];
};

export const getAaveV3CoreAddress = (chainId: number, coreContract: string): string | undefined => {
  const chainIdStr = chainId.toString();
  const chainConfig = (addresses as AddressesConfig)[chainIdStr];
  
  if (!chainConfig?.aaveV3?.core) {
    return undefined;
  }
  
  return chainConfig.aaveV3.core[coreContract];
};

export const getAaveV3AssetAddress = (chainId: number, tokenName: string, assetType: string): string | undefined => {
  const chainIdStr = chainId.toString();
  const chainConfig = (addresses as AddressesConfig)[chainIdStr];
  
  if (!chainConfig?.aaveV3?.assets?.[tokenName]) {
    return undefined;
  }
  
  const asset = chainConfig.aaveV3.assets[tokenName];
  return asset[assetType as keyof typeof asset] as string;
};

export const getNetworkName = (chainId: number): string | undefined => {
  const chainIdStr = chainId.toString();
  const chainConfig = (addresses as AddressesConfig)[chainIdStr];
  
  return chainConfig?.networkName;
};

// Convenience functions for common contract addresses
export const getYieldAggregatorAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'YieldAggregator');
};

export const getMockERC20Address = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'MockERC20');
};

export const getMockYieldStrategyAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'MockYieldStrategy');
};

export const getAaveV3LINKStrategyAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'AaveV3LINKStrategy');
}; 