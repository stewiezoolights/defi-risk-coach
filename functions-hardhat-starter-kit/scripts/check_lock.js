require("dotenv").config()
async function main() {
  const { ethers } = require("hardhat")
  const RISK_LOCK = process.env.RISK_LOCK_ADDRESS
  const USER = process.env.TEST_USER_ADDRESS

  if (!RISK_LOCK || !USER) {
    throw new Error("Please set RISK_LOCK_ADDRESS and TARGET_USER_ADDRESS in .env")
  }

  const lock = await ethers.getContractAt("RiskLock", RISK_LOCK)
  const isLocked = await lock.isLocked(USER)
  console.log(`🔒 User ${USER} locked?`, isLocked)
}
main().catch(console.error)
