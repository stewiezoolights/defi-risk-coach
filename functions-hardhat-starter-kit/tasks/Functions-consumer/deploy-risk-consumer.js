const { types } = require("hardhat/config")
const { networks } = require("../../networks")
const { writeDeployment } = require("../utils/writeDeployment")

task("deploy-risk-consumer", "Deploys the RiskFunctionsConsumer contract with router + DON")
  .addParam("risklock", "Address of the deployed RiskLock contract")
  .addParam("proxy", "Address of the deployed RiskCooldownProxy contract")
  .addParam("guardian", "Address of the deployed Guardian contract")
  .addParam("elizaagent", "ElizaOS agent address (authorized trigger)")
  .addOptionalParam("verify", "Set to true to verify contract", false, types.boolean)

  .setAction(async (taskArgs, hre) => {
    const net = hre.network.name
    const config = networks[net]
    if (!config) throw new Error(`❌ No config found for network: ${net}`)

    const router = config.functionsRouter
    const donIdBytes32 = hre.ethers.utils.formatBytes32String(config.donId)
    const riskLock = taskArgs.risklock

    if (!router || router === "UNSET") throw new Error("❌ Router address missing in networks config")
    if (!config.donId) throw new Error("❌ DON ID missing in networks config")

    console.log(`📦 Deploying RiskFunctionsConsumer to ${net}...`)
    const factory = await hre.ethers.getContractFactory("contracts/RiskFunctionsConsumer.sol:RiskFunctionsConsumer")

    const consumer = await factory.deploy(router, donIdBytes32, riskLock)
    await consumer.deployTransaction.wait(config.confirmations)

    console.log("✅ Deployed RiskFunctionsConsumer at:", consumer.address)

    if (taskArgs.verify && config.verifyApiKey !== "UNSET") {
      console.log("🔍 Verifying contract...")
      try {
        await hre.run("verify:verify", {
          address: consumer.address,
          constructorArguments: [router, donIdBytes32, riskLock],
        })
        console.log("✅ Contract verified")
      } catch (err) {
        if (err.message.includes("Already Verified")) {
          console.log("ℹ️ Contract already verified")
        } else {
          console.error("❌ Verification failed:", err.message)
        }
      }
    }
    console.log("\n📌 Next Step:")
    console.log(`➡️  Use this consumer address in your RiskLock deployment:`)
    console.log(`   --consumer ${consumer.address}`)
    writeDeployment(net, "RiskFunctionsConsumer", consumer.address)
    writeDeployment(net, "Guardian", guardian)
    writeDeployment(net, "RiskLock", riskLock)
    writeDeployment(net, "RiskCooldownProxy", cooldownProxy)
    writeDeployment(net, "ElizaAgent", elizaAgent)
  })
