const readline = require("readline")
const hre = require("hardhat")
const { writeEnvVariable } = require("../tasks/utils/writeEnv")
const { writeDeployment } = require("../tasks/utils/writeDeployment")

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  )
}

async function deployWizard() {
  const net = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  console.log(`\n🧙 Deploy Wizard - Network: ${net}`)
  console.log(`Deployer: ${deployer.address}\n`)

  // 1. Deploy Guardian
  console.log("1. Deploying Guardian...")
  const Guardian = await hre.ethers.getContractFactory("contracts/Gaurdian.sol:Guardian")
  const guardian = await Guardian.deploy()
  await guardian.deployed()
  writeDeployment(net, "Guardian", guardian.address)
  console.log(`✅ Guardian deployed to: ${guardian.address}`)

  // 2. Prompt for Eliza Agent
  const elizaAgent = await prompt("2. 🤖 Enter ElizaOS agent address: ")
  writeDeployment(net, "ElizaAgent", elizaAgent)

  // 3. Deploy RiskLock (with placeholder for consumer and proxy)
  console.log("3. Deploying RiskLock...")
  const RiskLock = await hre.ethers.getContractFactory("contracts/RiskLock.sol:RiskLock")
  const riskLock = await RiskLock.deploy(
    "0x0000000000000000000000000000000000000000", // placeholder consumer
    "0x0000000000000000000000000000000000000000", // placeholder proxy
    guardian.address
  )
  await riskLock.deployed()
  writeDeployment(net, "RiskLock", riskLock.address)
  console.log(`✅ RiskLock deployed to: ${riskLock.address}`)

  // 4. Deploy RiskCooldownProxy (depends on RiskLock)
  console.log("4. Deploying RiskCooldownProxy...")
  const cooldownProxyFactory = await hre.ethers.getContractFactory("contracts/RiskCooldownProxy.sol:RiskCooldownProxy")
  const seventyTwoHoursInSeconds = 72 * 60 * 60
  const cooldownProxy = await cooldownProxyFactory.deploy(
    elizaAgent,
    riskLock.address,
    seventyTwoHoursInSeconds
  )
  await cooldownProxy.deployed()
  writeDeployment(net, "RiskCooldownProxy", cooldownProxy.address)
  console.log(`✅ RiskCooldownProxy deployed to: ${cooldownProxy.address}`)

  // 5. Deploy RiskFunctionsConsumer (depends on RiskLock and CooldownProxy)
  console.log("5. Deploying RiskFunctionsConsumer...")
  const router = hre.network.config.functionsRouter || "UNSET"
  const donId = hre.network.config.donId || "UNSET"
  if (router === "UNSET" || donId === "UNSET") throw new Error("❌ Missing router or DON ID in network config")
  const donIdBytes32 = hre.ethers.utils.formatBytes32String(donId)

  const ConsumerFactory = await hre.ethers.getContractFactory(
    "contracts/RiskFunctionsConsumer.sol:RiskFunctionsConsumer"
  )
  const consumer = await ConsumerFactory.deploy(
    router,
    donIdBytes32,
    riskLock.address,
    cooldownProxy.address,
    guardian.address,
    elizaAgent
  )
  await consumer.deployed()
  writeDeployment(net, "RiskFunctionsConsumer", consumer.address)
  console.log(`✅ RiskFunctionsConsumer deployed to: ${consumer.address}`)

  // 6. Link dependencies using setter functions
  console.log("\n6. Linking contract dependencies...")

  console.log("   - Setting consumer on RiskLock...")
  const tx1 = await riskLock.setConsumer(consumer.address)
  await tx1.wait()
  console.log("   ✅ RiskLock linked to consumer.")

  console.log("   - Setting cooldown proxy on RiskLock...")
  const tx2 = await riskLock.setCooldownProxy(cooldownProxy.address)
  await tx2.wait()
  console.log("   ✅ RiskLock linked to cooldown proxy.")

  console.log("   - Setting consumer on RiskCooldownProxy...")
  const tx3 = await cooldownProxy.setConsumer(consumer.address)
  await tx3.wait()
  console.log("   ✅ RiskCooldownProxy linked to consumer.")

  // 7. Save all .env variables
  writeEnvVariable("RISK_LOCK_ADDRESS", riskLock.address)
  writeEnvVariable("RISK_CONSUMER_ADDRESS", consumer.address)
  writeEnvVariable("GUARDIAN_ADDRESS", guardian.address)
  writeEnvVariable("COOLDOWN_PROXY_ADDRESS", cooldownProxy.address)
  writeEnvVariable("ELIZA_AGENT_ADDRESS", elizaAgent)

  console.log("\n✅ Deployment Complete:")
  console.log(`Guardian:               ${guardian.address}`)
  console.log(`CooldownProxy:          ${cooldownProxy.address}`)
  console.log(`RiskFunctionsConsumer:  ${consumer.address}`)
  console.log(`RiskLock:               ${riskLock.address}`)

  console.log(`\n📝 Saved to: deployments/${net}.json and .env`)
}

deployWizard().catch((err) => {
  console.error("❌ Deployment failed:", err.message)
  process.exit(1)
})
