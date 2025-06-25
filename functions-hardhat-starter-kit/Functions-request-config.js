const fs = require("fs")
const path = require("path")
require("dotenv").config() // Load .env

const { Location, CodeLanguage, ReturnType } = require("@chainlink/functions-toolkit")

// ✅ Load and validate test user
const user = process.env.TEST_USER_ADDRESS
if (!user || !user.startsWith("0x") || user.length !== 42) {
  throw new Error("❌ TEST_USER_ADDRESS not set or invalid in .env")
}

// ✅ Define args as strings only
const args = [
  "1", // Number of users
  `${user}`, // User wallet address
  "10", // maxLossPercent
  "2", // maxLossCount
  "15", // maxTrades
  "24", // timeframeHours
]

console.log("📦 Chainlink Functions Request Args:", args)

module.exports.buildRequestConfig = async () => ({
  codeLocation: Location.Inline,
  codeLanguage: CodeLanguage.JavaScript,
  source: fs.readFileSync(path.join(__dirname, "source/batchMonitorPerennial.js"), "utf-8"),
  secrets: {},
  secretsLocation: Location.Remote,
  encryptedSecretsReference: "0x",
  args,
  bytesArgs: [],
  expectedReturnType: ReturnType.bytes,
  callbackGasLimit: 300000,
})
