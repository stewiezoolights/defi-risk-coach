require("dotenv").config()
const { ethers } = require("hardhat")

async function main() {
  const simulate = process.argv.includes("--simulate")
  const user = process.env.TEST_USER_ADDRESS
  const consumer = await ethers.getContractAt(
    "contracts/RiskFunctionsConsumer.sol:RiskFunctionsConsumer",
    process.env.RISK_CONSUMER_ADDRESS
  )
  const riskLock = await ethers.getContractAt("contracts/RiskLock.sol:RiskLock", process.env.RISK_LOCK_ADDRESS)
  const cooldownProxy = await ethers.getContractAt(
    "contracts/RiskCooldownProxy.sol:RiskCooldownProxy",
    process.env.COOLDOWN_PROXY_ADDRESS
  )

  console.log(`🔍 Testing system integration for user: ${user}`)

  if (simulate) {
    console.log("🧪 Simulating testFulfill()")
    await consumer.testFulfill([user], [true])
  } else {
    console.log("⚠️ You must use Chainlink Functions to call fulfillRequest")
    return
  }

  const locked = await riskLock.isLocked(user)
  const cooldown = await cooldownProxy.getCooldownRemaining(user)

  console.log(`🔒 isLocked(${user}) = ${locked}`)
  console.log(`⏱️ Cooldown remaining = ${cooldown} seconds`)
}

main().catch((err) => {
  console.error("❌ Test failed:", err.message)
  process.exit(1)
})
