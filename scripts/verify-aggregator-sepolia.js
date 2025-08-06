const hre = require("hardhat");

async function main() {
  const contractAddress = "0x7916Ff9a9Da14566ed7Cb65fe67e8e6de62EC112";
  
  const constructorArguments = [
    [
      "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5", // LINK
      "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c", // WETH
      "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // USDC
      "0x29f2D40B0605204364af54EC677bD022dA425d03", // WBTC
      "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a", // AAVE
      "0x6d906e526a4e2Ca02097BA9d0caA3c382F52278E"  // EURS
    ]
  ];

  console.log("�� Verifying YieldAggregator contract...");
  console.log(`Contract Address: ${contractAddress}`);
  console.log("Constructor Arguments:", constructorArguments);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    // Try alternative format
    console.log("\n�� Trying alternative verification format...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          [
            "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
            "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c", 
            "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
            "0x29f2D40B0605204364af54EC677bD022dA425d03",
            "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a",
            "0x6d906e526a4e2Ca02097BA9d0caA3c382F52278E"
          ]
        ],
      });
      console.log("✅ Contract verified successfully with alternative format!");
    } catch (altError) {
      console.error("❌ Alternative verification also failed:", altError.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });