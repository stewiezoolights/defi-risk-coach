const { ethers } = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying RiskCooldownProxy with account:",
    await deployer.getAddress()
  );

  const elizaAgent = process.env.ELIZA_AGENT_ADDRESS;
  const riskLock = process.env.RISKLOCK_ADDRESS;

  if (!ethers.isAddress(elizaAgent)) {
    throw new Error("Invalid ELIZA_AGENT_ADDRESS in .env");
  }

  if (!ethers.isAddress(riskLock)) {
    throw new Error("Invalid RISKLOCK_ADDRESS in .env");
  }

  const Proxy = await ethers.getContractFactory("RiskCooldownProxy");
  const proxy = await Proxy.deploy(elizaAgent, riskLock);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("✅ RiskCooldownProxy deployed at:", proxyAddress);

  // Write to .env
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";

  envContent = envContent
    .replace(/\n?RISKCOOLDOWNPROXY_ADDRESS=.*/g, "")
    .trim();

  const newEnv = `${envContent}\nRISKCOOLDOWNPROXY_ADDRESS=${proxyAddress}\n`;
  fs.writeFileSync(envPath, newEnv);
  console.log("📦 Updated .env with RISKCOOLDOWNPROXY_ADDRESS");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
