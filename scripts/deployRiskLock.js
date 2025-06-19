const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  const guardianAddress = process.env.GUARDIAN_ADDRESS;
  const consumerAddress = process.env.FUNCTIONS_CONSUMER_ADDRESS;

  if (!guardianAddress || !ethers.utils.isAddress(guardianAddress)) {
    throw new Error("❌ Invalid GUARDIAN_ADDRESS in .env");
  }

  if (!consumerAddress || !ethers.utils.isAddress(consumerAddress)) {
    throw new Error("❌ Invalid FUNCTIONS_CONSUMER_ADDRESS in .env");
  }

  console.log("🧑‍🚀 Deployer:", deployer.address);
  console.log("🛡️  Guardian address:", guardianAddress);
  console.log("🔁 FunctionsConsumer address:", consumerAddress);

  const RiskLock = await ethers.getContractFactory("RiskLock");
  const riskLock = await RiskLock.deploy(guardianAddress, consumerAddress);
  await riskLock.deployed();

  console.log("✅ RiskLock deployed at:", riskLock.address);

  // Optional: Write to .env
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";

  if (envContent.includes("RISKLOCK_ADDRESS=")) {
    envContent = envContent.replace(
      /RISKLOCK_ADDRESS=.*/g,
      `RISKLOCK_ADDRESS=${riskLock.address}`
    );
  } else {
    envContent += `\nRISKLOCK_ADDRESS=${riskLock.address}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("📦 Updated .env with RISKLOCK_ADDRESS.");
}

main().catch((err) => {
  console.error("❌ Deployment error:", err);
  process.exit(1);
});
