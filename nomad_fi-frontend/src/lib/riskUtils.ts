// Utility to calculate risk category for a YieldStrategy

export type YieldStrategy = {
  baseRiskScore: number; // 1 (low) to 10 (high)
  name: string;
  chainId: number;
  strategyAddress: string;
  // ...other fields as needed
};

// Conceptual/simulated risk factors for MVP
export function getSimulatedRiskFactors(strategy: YieldStrategy) {
  // Simulate protocol age and TVL based on strategy name or address for MVP
  const protocolAgeInDays = strategy.name.includes("Hardhat") ? 10 : 200; // e.g., local = new, remote = old
  const simulatedTVL = strategy.name.includes("Sepolia") ? 1000000 : 10000; // e.g., remote = high TVL
  const hasAudit = strategy.name.includes("Mock") ? false : true; // e.g., all mock = no audit
  return { protocolAgeInDays, simulatedTVL, hasAudit };
}

export function calculateRiskCategory(strategy: YieldStrategy): string {
  const { baseRiskScore } = strategy;
  const { protocolAgeInDays, simulatedTVL, hasAudit } = getSimulatedRiskFactors(strategy);

  // Simple logic for MVP
  if (baseRiskScore >= 8 && !hasAudit) return "Very High";
  if (baseRiskScore >= 6 && (!hasAudit || protocolAgeInDays < 30)) return "High";
  if (baseRiskScore >= 4 && protocolAgeInDays < 90) return "Medium";
  if (baseRiskScore <= 3 && protocolAgeInDays > 180 && hasAudit && simulatedTVL > 500000) return "Very Low";
  return "Low";
} 