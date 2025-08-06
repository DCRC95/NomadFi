# AAVE Yield Strategy Deployment Scripts

This directory contains flexible deployment scripts for AAVE yield strategies that can deploy to any Aave-related pool using the `addresses.json` configuration.

## Quick Start

### 1. List Available Assets
To see all available assets and their addresses:
```bash
node deploy/list-aave-assets.js
```

### 2. Deploy Using Command Line Arguments (Recommended)
Deploy a strategy for a specific asset:
```bash
# Deploy LINK strategy on Sepolia
npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset LINK

# Deploy USDC strategy on Sepolia
npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset USDC

# Deploy WETH strategy on Sepolia
npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset WETH
```

### 3. Deploy Using Configuration File
Edit the `CONFIG` object in `02_deploy_AAVEYieldStrategy.js`:
```javascript
const CONFIG = {
  networkId: "11155111", // Sepolia
  assetName: "LINK",     // Change this to deploy different assets
  strategyName: "AaveV3LINKStrategy",
  strategyDescription: "Aave V3 LINK yield strategy on Sepolia testnet"
};
```

Then run:
```bash
npx hardhat run deploy/02_deploy_AAVEYieldStrategy.js --network sepolia
```

## Available Assets

### Sepolia Testnet (11155111)
- **LINK**: Chainlink Token
- **USDC**: USD Coin
- **DAI**: Dai Stablecoin
- **WETH**: Wrapped Ether
- **WBTC**: Wrapped Bitcoin
- **USDT**: Tether USD
- **AAVE**: Aave Token
- **EURS**: STASIS EURS
- **GHO**: Aave GHO Stablecoin

## How It Works

### 1. Configuration Source
The scripts read asset addresses from `constants/addresses.json`:
```json
{
  "11155111": {
    "aaveV3": {
      "core": {
        "POOL_ADDRESSES_PROVIDER": "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A"
      },
      "assets": {
        "LINK": {
          "UNDERLYING": "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
          "A_TOKEN": "0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24"
        }
      }
    }
  }
}
```

### 2. Address Mapping
- **UNDERLYING**: The actual token address (e.g., LINK token)
- **A_TOKEN**: The Aave aToken address (e.g., aLINK token)
- **POOL_ADDRESSES_PROVIDER**: Aave V3 core contract address

### 3. Automatic Updates
After deployment, the script automatically:
- Updates `addresses.json` with the new strategy address
- Provides verification information for Etherscan
- Shows a deployment summary

## Deployment Examples

### Deploy LINK Strategy
```bash
npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset LINK
```

**Output:**
```
🚀 Deploying AAVE Strategy
================================
Asset: LINK
Network: sepolia (11155111)
Strategy: AaveV3LINKStrategy
================================

=== Configuration ===
Network: sepolia
Asset: LINK
AAVE_V3_ADDRESSES_PROVIDER: 0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A
UNDERLYING_TOKEN (LINK): 0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5
A_TOKEN (aLINK): 0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24
Decimals: 18

✅ AAVEYieldStrategy deployed at: 0x1234...
✅ Updated addresses.json with AaveV3LINKStrategy: 0x1234...
```

### Deploy USDC Strategy
```bash
npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset USDC
```

## Adding New Assets

To add a new asset to the deployment system:

1. **Add to addresses.json**:
```json
{
  "11155111": {
    "aaveV3": {
      "assets": {
        "NEW_TOKEN": {
          "UNDERLYING": "0x...",
          "A_TOKEN": "0x...",
          "DECIMALS": 18
        }
      }
    }
  }
}
```

2. **Deploy using the new asset**:
```bash
npx hardhat run deploy/deploy-aave-strategy.js --network sepolia --asset NEW_TOKEN
```

## Verification

After deployment, verify the contract on Etherscan using the constructor arguments provided in the output:

```bash
# Example constructor arguments for LINK strategy
[0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A, 0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5, 0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24]
```

## Troubleshooting

### Common Issues

1. **Asset not found**: Make sure the asset exists in `addresses.json`
2. **Network not supported**: Check that the network has Aave V3 configuration
3. **Insufficient gas**: Ensure your wallet has enough ETH for deployment

### Debug Commands

```bash
# List all available assets
node deploy/list-aave-assets.js

# Check network configuration
cat constants/addresses.json | jq '.["11155111"].aaveV3.assets'
```

## Integration with YieldAggregator

After deploying a strategy, you can register it with the YieldAggregator:

```javascript
// Example: Register the new strategy
await yieldAggregator.addStrategy(
  strategyId,
  underlyingTokenAddress,
  strategyAddress,
  strategyName,
  chainId,
  strategyType // 1 for Aave strategies
);
``` 