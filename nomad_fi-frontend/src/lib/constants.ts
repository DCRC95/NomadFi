// @ts-ignore
import YieldAggregatorAbi from "../abi/YieldAggregator.json" assert { type: "json" };
// @ts-ignore
import MockYieldStrategyAbi from "../abi/MockYieldStrategy.json" assert { type: "json" };

export const YIELD_AGGREGATOR_ABI = YieldAggregatorAbi.abi;
export const MOCK_YIELD_STRATEGY_ABI = MockYieldStrategyAbi.abi;

// Replace these with your actual deployed contract addresses
export const CONTRACT_ADDRESSES: Record<number, Record<string, string>> = {
  31337: {
    YieldAggregator: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    MockYieldStrategy: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    MockERC20: "0x5FbDB2315678afecb367f032d93F642f64180aa3"

  },
  11155111: {
    // Simulated remote (Sepolia)
    MockYieldStrategy: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
}; 