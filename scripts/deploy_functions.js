const { ethers } = require("hardhat");
const { isAddress } = require("ethers");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", await deployer.getAddress());

  const router = "0xf9B8fc078197181C841c296C876945aaa425B278"; // Base Sepolia Functions Router

  if (!isAddress(router)) {
    throw new Error("Invalid CHAINLINK_FUNCTIONS_ROUTER address");
  }

  // --- Deploy Guardian ---
  const Guardian = await ethers.getContractFactory("Guardian");
  const guardian = await Guardian.deploy();
  await guardian.waitForDeployment();
  const guardianAddress = await guardian.getAddress();
  console.log("Guardian deployed at:", guardianAddress);

  // --- Deploy RiskLock (now only needs guardian address) ---
  const RiskLock = await ethers.getContractFactory("RiskLock");
  const riskLock = await RiskLock.deploy(guardianAddress);
  await riskLock.waitForDeployment();
  const riskLockAddress = await riskLock.getAddress();
  console.log("RiskLock deployed at:", riskLockAddress);

  // --- Deploy RiskFunctionsConsumer ---
  const Consumer = await ethers.getContractFactory("RiskFunctionsConsumer");
  const consumer = await Consumer.deploy(router, riskLockAddress);
  await consumer.waitForDeployment();
  const consumerAddress = await consumer.getAddress();
  console.log("RiskFunctionsConsumer deployed at:", consumerAddress);

  // --- Link RiskFunctionsConsumer to RiskLock ---
  const tx = await riskLock.setFunctionsConsumer(consumerAddress);
  await tx.wait();
  console.log("Linked FunctionsConsumer to RiskLock");

  // --- Update .env file ---
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";

  envContent = envContent
    .replace(/\n?GUARDIAN_ADDRESS=.*/g, "")
    .replace(/\n?RISKLOCK_ADDRESS=.*/g, "")
    .replace(/\n?FUNCTIONS_CONSUMER_ADDRESS=.*/g, "")
    .replace(/\n?CHAINLINK_FUNCTIONS_ROUTER=.*/g, "")
    .trim();

  const newEnv =
    `${envContent}\n` +
    `GUARDIAN_ADDRESS=${guardianAddress}\n` +
    `RISKLOCK_ADDRESS=${riskLockAddress}\n` +
    `FUNCTIONS_CONSUMER_ADDRESS=${consumerAddress}\n` +
    `CHAINLINK_FUNCTIONS_ROUTER=${router}\n`;

  fs.writeFileSync(envPath, newEnv.trim() + "\n");
  console.log("\n✅ Contract addresses written to .env");
}

main().catch((error) => {
  console.error("❌ Deployment error:", error);
  process.exitCode = 1;
});
