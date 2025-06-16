const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const Guardian = await ethers.getContractFactory("Guardian");
  const guardian = await Guardian.deploy();
  await guardian.deployed();

  console.log("Guardian deployed at:", guardian.address);

  // Optional: Add deployer as an authorized guardian
  const tx = await guardian.addGuardian(deployer.address);
  await tx.wait();
  console.log("Guardian added:", deployer.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
