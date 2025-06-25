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
  const Guardian = await hre.ethers.getContractFactory("contracts/Gaurdian.sol:Guardian")
  const guardian = await Guardian.deploy()
  await guardian.deployed()
  writeDeployment(net, "Guardian", guardian.address)

  // 2. Prompt for Eliza Agent
  const elizaAgent = await prompt("🤖 Enter ElizaOS agent address: ")
  writeDeployment(net, "ElizaAgent", elizaAgent)

  // 3. Deploy placeholder Consumer
  const router = hre.network.config.functionsRouter || "UNSET"
  const donId = hre.network.config.donId || "UNSET"
  if (router === "UNSET" || donId === "UNSET") throw new Error("❌ Missing router or DON ID in network config")
  const donIdBytes32 = hre.ethers.utils.formatBytes32String(donId)

  const ConsumerFactory = await hre.ethers.getContractFactory(
    "contracts/RiskFunctionsConsumer.sol:RiskFunctionsConsumer"
  )
  const placeholderConsumer = await ConsumerFactory.deploy(
    router,
    donIdBytes32,
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
    guardian.address,
    elizaAgent
  )
  await placeholderConsumer.deployed()
  console.log("🚧 Deployed temporary consumer at:", placeholderConsumer.address)

  // 4. Deploy RiskLock with placeholder proxy
  const RiskLock = await hre.ethers.getContractFactory("contracts/RiskLock.sol:RiskLock")
  const placeholderLock = await RiskLock.deploy(
    placeholderConsumer.address,
    "0x0000000000000000000000000000000000000000",
    guardian.address
  )
  await placeholderLock.deployed()
  console.log("🚧 Deployed temporary lock at:", placeholderLock.address)

  // 5. Deploy real CooldownProxy
  const Proxy = await hre.ethers.getContractFactory("contracts/RiskCooldownProxy.sol:RiskCooldownProxy")
  const cooldownProxy = await Proxy.deploy(elizaAgent, placeholderLock.address)
  await cooldownProxy.deployed()
  writeDeployment(net, "RiskCooldownProxy", cooldownProxy.address)

  // 6. Redeploy Consumer with real lock + proxy
  const finalConsumer = await ConsumerFactory.deploy(
    router,
    donIdBytes32,
    placeholderLock.address,
    cooldownProxy.address,
    guardian.address,
    elizaAgent
  )
  await finalConsumer.deployed()
  writeDeployment(net, "RiskFunctionsConsumer", finalConsumer.address)

  // 7. Redeploy RiskLock with final consumer + proxy
  const finalLock = await RiskLock.deploy(finalConsumer.address, cooldownProxy.address, guardian.address)
  await finalLock.deployed()
  writeDeployment(net, "RiskLock", finalLock.address)

  // 8. Save all .env variables (AFTER finalConsumer and finalLock exist!)
  writeEnvVariable("RISK_LOCK_ADDRESS", finalLock.address)
  writeEnvVariable("RISK_CONSUMER_ADDRESS", finalConsumer.address)
  writeEnvVariable("GUARDIAN_ADDRESS", guardian.address)
  writeEnvVariable("COOLDOWN_PROXY_ADDRESS", cooldownProxy.address)
  writeEnvVariable("ELIZA_AGENT_ADDRESS", elizaAgent)

  console.log("\n✅ Deployment Complete:")
  console.log(`Guardian:               ${guardian.address}`)
  console.log(`CooldownProxy:          ${cooldownProxy.address}`)
  console.log(`RiskFunctionsConsumer:  ${finalConsumer.address}`)
  console.log(`RiskLock:               ${finalLock.address}`)

  console.log(`\n📝 Saved to: deployments/${net}.json and .env`)
}

deployWizard().catch((err) => {
  console.error("❌ Deployment failed:", err.message)
  process.exit(1)
})
