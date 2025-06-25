// scripts/deployAll.js
const hre = require("hardhat")
const fs = require("fs")
const path = require("path")

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log("Deploying contracts with:", deployer.address)

  // Deploy Guardian
  const Guardian = await hre.ethers.getContractFactory("Guardian")
  const guardian = await Guardian.deploy()
  await guardian.deployed() // ✅ Ethers v5
  const guardianAddress = guardian.address
  console.log("Guardian deployed to:", guardianAddress)

  // Deploy RiskLock
  const RiskLock = await hre.ethers.getContractFactory("RiskLock")
  const riskLock = await RiskLock.deploy(guardianAddress)
  await riskLock.deployed()
  const riskLockAddress = riskLock.address
  console.log("RiskLock deployed to:", riskLockAddress)

  // Deploy RiskCooldownProxy
  const RiskCooldownProxy = await hre.ethers.getContractFactory("RiskCooldownProxy")
  const elizaAgent = deployer.address
  const cooldownProxy = await RiskCooldownProxy.deploy(elizaAgent, riskLockAddress)
  await cooldownProxy.deployed()
  const cooldownProxyAddress = cooldownProxy.address
  console.log("RiskCooldownProxy deployed to:", cooldownProxyAddress)

  // Deploy RiskFunctionsConsumer
  const RiskFunctionsConsumer = await hre.ethers.getContractFactory("RiskFunctionsConsumer")
  const donIdBytes32 = hre.ethers.utils.formatBytes32String("fun-base-sepolia-1") // Ethers v5
  const oracle = "0x6B9EC7bD5f075BBA4A73D2bC8293D0E4eEC51B74" // TODO
  const registry = "0xa6fD71b7b10867dC7f2A8E07d26313206eB5fEba" // TODO
  const functionsConsumer = await RiskFunctionsConsumer.deploy(donIdBytes32, oracle, registry, riskLockAddress)
  await functionsConsumer.deployed()
  const consumerAddress = functionsConsumer.address
  console.log("RiskFunctionsConsumer deployed to:", consumerAddress)

  // Link RiskLock to consumer
  const tx = await riskLock.setConsumer(consumerAddress)
  await tx.wait()
  console.log("Linked RiskLock to RiskFunctionsConsumer")

  // Save addresses
  const deployments = {
    guardian: guardianAddress,
    riskLock: riskLockAddress,
    cooldownProxy: cooldownProxyAddress,
    functionsConsumer: consumerAddress,
    deployedBy: deployer.address,
    network: "baseSepolia",
  }

  const outputPath = path.join(__dirname, "..", "deployments", "baseSepolia.json")
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(deployments, null, 2))
  console.log("✅ Deployment addresses written to deployments/baseSepolia.json")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
