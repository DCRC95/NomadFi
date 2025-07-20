# Multi-Chain Strategy System

This system allows you to view and interact with yield strategies across multiple blockchain networks from a single interface.

## How It Works

### 1. **Chain Configuration** (`lib/chainConfig.ts`)
- Reads contract addresses from `constants/addresses.json`
- Configures RPC endpoints for each chain
- Tracks which chains are active (have working YieldAggregators)

### 2. **Data Fetching** (`hooks/useMultiChainStrategies.ts`)
- Fetches strategies from all active chains in parallel
- Uses batch functions to minimize RPC calls
- Handles errors gracefully (if one chain fails, others still work)

### 3. **UI Component** (`components/MultiChainStrategyList.tsx`)
- Displays strategies from all chains in a unified interface
- Shows chain information and network switching buttons
- Handles loading states and errors

## Current Chain Status

| Chain | Status | Notes |
|-------|--------|-------|
| **Hardhat Network** | ✅ Active | Uses latest YieldAggregator |
| **Sepolia** | ✅ Active | Uses latest YieldAggregator |
| **Polygon Amoy** | ⚠️ Inactive | Has OLD_YieldAggregator |

## Usage

### Basic Usage
```tsx
import { MultiChainStrategyList } from './components/MultiChainStrategyList';

function MyPage() {
  return (
    <div>
      <h1>Yield Strategies</h1>
      <MultiChainStrategyList />
    </div>
  );
}
```

### Advanced Usage
```tsx
import { MultiChainStrategyList } from './components/MultiChainStrategyList';
import { StrategyInfo } from './hooks/useMultiChainStrategies';

function MyPage() {
  const handleStrategySelect = (strategy: StrategyInfo) => {
    console.log('Selected:', strategy);
    // Navigate to detail page or open modal
  };

  return (
    <MultiChainStrategyList
      showAPY={true}
      onStrategySelect={handleStrategySelect}
    />
  );
}
```

## Key Features

### ✅ **Always Uses addresses.json**
- No hardcoded addresses
- Automatically picks up new deployments
- Respects your contract management

### ✅ **Batch Function Usage**
- `getBatchStrategyData()` - gets all strategies in one call
- `getBatchUserData()` - gets all user data in one call
- Minimal RPC usage (3 calls per chain total)

### ✅ **Error Handling**
- If one chain fails, others still work
- Graceful degradation
- Clear error messages

### ✅ **Network Switching**
- "Switch Network" buttons for each strategy
- Automatically switches to the correct chain
- Works with Hardhat, Sepolia, and Polygon Amoy

## Adding New Chains

To add a new chain:

1. **Update `addresses.json`** with the new chain's contract addresses
2. **Add chain config** in `lib/chainConfig.ts`
3. **Set `isActive: true`** if it has a working YieldAggregator

Example:
```json
// In addresses.json
{
  "137": {
    "networkName": "polygon",
    "deployedContracts": {
      "YieldAggregator": "0x..."
    }
  }
}
```

```typescript
// In chainConfig.ts
{
  id: "137",
  name: "Polygon Mainnet",
  rpcUrl: "https://polygon-rpc.com",
  aggregatorAddress: addresses["137"].deployedContracts.YieldAggregator,
  networkName: addresses["137"].networkName,
  isActive: true
}
```

## Troubleshooting

### Polygon Amoy Not Showing
**Issue**: Polygon Amoy has `OLD_YieldAggregator` instead of `YieldAggregator`

**Solution**: Deploy a new YieldAggregator on Polygon Amoy and update `addresses.json`

### Chain Not Loading
**Check**:
1. RPC URL is correct and accessible
2. YieldAggregator address is correct
3. Contract is deployed and has strategies

### APY Not Showing
**Check**:
1. Strategy contract has `getAPY()` function
2. User is on the correct network
3. Strategy is active

## Performance

- **3 RPC calls per chain** (strategy count + batch data + APY)
- **Parallel fetching** - all chains queried simultaneously
- **Caching** - data cached until manual refresh
- **Error isolation** - one chain failure doesn't affect others 