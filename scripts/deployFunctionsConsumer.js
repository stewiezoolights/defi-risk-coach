const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const Consumer = await ethers.getContractFactory("RiskFunctionsConsumer");
  const consumer = await Consumer.deploy(
    "0xcc79157eb46f5624204f47ab42b3906caa40ea7f", // Sepolia Functions Router
    process.env.CCIP_ROUTER_ETHEREUM_SEPOLIA,
    process.env.CCIP_RECEIVER_ON_BASE
  );
  await consumer.deployed();

  console.log("RiskFunctionsConsumer deployed to:", consumer.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
