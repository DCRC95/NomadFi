// deploy/02_deploy_AAVEYieldStrategy_USDC.js
// Deploys AAVEYieldStrategy for USDC on Sepolia with correct addresses

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);

  // --- ENVIRONMENT VARIABLES ---
  const AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA = process.env.AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA;
  if (!AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA) {
    throw new Error("Missing env var: AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA");
  }

  // --- CONSTANTS ---
  const LINK_SEPOLIA = "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5";
  const aLINK_SEPOLIA = "0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24";

  console.log("AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA:", AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA);
  console.log("LINK_SEPOLIA:", LINK_SEPOLIA);
  console.log("aLINK_SEPOLIA:", aLINK_SEPOLIA);

  // --- DEPLOY AAVEYieldStrategy ---
  console.log("Deploying AAVEYieldStrategy...");
  const AAVEYieldStrategy = await hre.ethers.getContractFactory("AAVEYieldStrategy");
  const aaveYieldStrategy = await AAVEYieldStrategy.deploy(
    AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA,
    LINK_SEPOLIA,
    aLINK_SEPOLIA
  );
  await aaveYieldStrategy.waitForDeployment();
  console.log(`AAVEYieldStrategy deployed at: ${aaveYieldStrategy.target}`);
  console.log("Constructor arguments:");
  console.log("AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA:", AAVE_V3_ADDRESSES_PROVIDER_SEPOLIA);
  console.log("LINK_SEPOLIA:", link_SEPOLIA);
  console.log("aLINK_SEPOLIA:", alink_SEPOLIA);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 