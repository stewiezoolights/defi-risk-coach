const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const guardianAddress = process.env.GUARDIAN_ADDRESS; // set this in .env

  const RiskLock = await ethers.getContractFactory("RiskLock");
  const riskLock = await RiskLock.deploy(guardianAddress);
  await riskLock.deployed();

  console.log("RiskLock deployed at:", riskLock.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
