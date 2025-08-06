import { defineConfig } from '@wagmi/cli';
import { hardhat } from '@wagmi/cli/plugins';

export default defineConfig({
  out: 'src/generated.ts', // Output file for generated contract configs
  plugins: [
    hardhat({
      // Path to your Hardhat project (relative to this config file)
      project: '../', // Your Hardhat project is one level up from frontend
      deployments: 'deployments',
      artifacts: 'artifacts',
      contracts: [
        {
          name: 'AAVEYieldStrategy',
          chainId: 11155111, // Sepolia
        },
        {
          name: 'YieldAggregator',
          chainId: 11155111, // Sepolia
        },
        {
          name: 'CompoundWETHStrategy',
          chainId: 11155111, // Sepolia
        },
        {
          name: 'AAVEYieldStrategy',
          chainId: 84532, // Base Sepolia
        },
        {
          name: 'YieldAggregator',
          chainId: 84532, // Base Sepolia
        },
        {
          name: 'MockERC20',
          chainId: 31337, // Hardhat
        },
        {
          name: 'MockYieldStrategy',
          chainId: 31337, // Hardhat
        },
        {
          name: 'YieldAggregator',
          chainId: 31337, // Hardhat
        },
      ],
    }),
  ],
});