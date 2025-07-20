// deploy/00_minimal_deploy_AAVEYieldStrategy.js
// Minimal deploy script for AAVEYieldStrategy only

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // Hardcoded dummy addresses for local test
  const DUMMY_AAVE_PROVIDER = "0x0000000000000000000000000000000000000001";
  const DUMMY_UNDERLYING_TOKEN = "0x0000000000000000000000000000000000000002";
  const DUMMY_ATOKEN = "0x0000000000000000000000000000000000000003";

  log("Deploying AAVEYieldStrategy (minimal test)...");
  const aaveYieldStrategy = await deploy("AAVEYieldStrategy", {
    from: deployer,
    args: [DUMMY_AAVE_PROVIDER, DUMMY_UNDERLYING_TOKEN, DUMMY_ATOKEN],
    log: true,
  });
  log(`AAVEYieldStrategy deployed at: ${aaveYieldStrategy.address}`);
};

module.exports.tags = ["AAVEYieldStrategyMinimalTest"]; 