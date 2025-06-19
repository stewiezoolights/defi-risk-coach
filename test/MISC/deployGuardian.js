const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const guardianAddress = process.env.INITIAL_GUARDIAN;

  if (!guardianAddress || !ethers.utils.isAddress(guardianAddress)) {
    throw new Error(
      "❌ Please provide a valid INITIAL_GUARDIAN address in your .env file."
    );
  }

  console.log("🧑‍🚀 Deployer:", deployer.address);
  console.log("🌐 Network:", network.name);
  console.log("🔐 Initial guardian to add:", guardianAddress);

  const Guardian = await ethers.getContractFactory("Guardian");
  const guardian = await Guardian.deploy();
  await guardian.deployed();

  console.log("✅ Guardian contract deployed at:", guardian.address);

  const tx = await guardian.addGuardian(guardianAddress);
  const receipt = await tx.wait();

  console.log("🛡️  Guardian added:", guardianAddress);
  console.log("⛽ Gas used:", receipt.gasUsed.toString());

  // Optional: Save address to .env
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("GUARDIAN_ADDRESS=")) {
      envContent = envContent.replace(
        /GUARDIAN_ADDRESS=.*/g,
        `GUARDIAN_ADDRESS=${guardian.address}`
      );
    } else {
      envContent += `\nGUARDIAN_ADDRESS=${guardian.address}`;
    }
  } else {
    envContent = `GUARDIAN_ADDRESS=${guardian.address}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("📦 Updated .env with GUARDIAN_ADDRESS.");
}

main().catch((err) => {
  console.error("❌ Deployment error:", err);
  process.exit(1);
});
