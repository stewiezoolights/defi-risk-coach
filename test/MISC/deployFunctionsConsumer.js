const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Use the Chainlink Functions Router for Base Sepolia
  const functionsRouterAddress = "0x267c184b7a55A3B1038Cbb8e2A807780f37C9e7c"; // Verified as of June 2025

  const riskLockAddress = process.env.RISKLOCK_ADDRESS;
  if (!riskLockAddress || !ethers.utils.isAddress(riskLockAddress)) {
    throw new Error("❌ Invalid or missing RISKLOCK_ADDRESS in .env");
  }

  console.log("🧑‍🚀 Deployer:", deployer.address);
  console.log("🔗 Chainlink Functions Router:", functionsRouterAddress);
  console.log("🔒 RiskLock address:", riskLockAddress);

  const Consumer = await ethers.getContractFactory("RiskFunctionsConsumer");
  const consumer = await Consumer.deploy(
    functionsRouterAddress,
    riskLockAddress
  );
  await consumer.deployed();

  console.log("✅ RiskFunctionsConsumer deployed at:", consumer.address);

  // Optional: Update .env with the deployed address
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";

  if (envContent.includes("FUNCTIONS_CONSUMER_ADDRESS=")) {
    envContent = envContent.replace(
      /FUNCTIONS_CONSUMER_ADDRESS=.*/g,
      `FUNCTIONS_CONSUMER_ADDRESS=${consumer.address}`
    );
  } else {
    envContent += `\nFUNCTIONS_CONSUMER_ADDRESS=${consumer.address}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("📦 Updated .env with FUNCTIONS_CONSUMER_ADDRESS.");
}

main().catch((err) => {
  console.error("❌ Deployment error:", err);
  process.exit(1);
});
