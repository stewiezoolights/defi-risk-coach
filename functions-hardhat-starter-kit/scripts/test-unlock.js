require("dotenv").config()
const { ethers } = require("hardhat")

async function main() {
  const user = process.env.TEST_USER_ADDRESS
  const riskLock = await ethers.getContractAt("contracts/RiskLock.sol:RiskLock", process.env.RISK_LOCK_ADDRESS)
  const cooldownProxy = await ethers.getContractAt(
    "contracts/RiskCooldownProxy.sol:RiskCooldownProxy",
    process.env.COOLDOWN_PROXY_ADDRESS
  )

  const remaining = await cooldownProxy.getCooldownRemaining(user)
  console.log(`⏱️ Cooldown remaining for ${user}: ${remaining}s`)

  if (remaining > 0) {
    console.log("⛔ Still in cooldown, cannot unlock.")
    return
  }

  console.log("🔓 Unlocking user...")
  await riskLock.connect(await ethers.getSigner(user)).unlockAfterCooldown()
  const isLocked = await riskLock.isLocked(user)
  console.log(`🔒 isLocked(${user}) = ${isLocked}`)
}

main().catch((err) => {
  console.error("❌ Unlock test failed:", err.message)
  process.exit(1)
})
