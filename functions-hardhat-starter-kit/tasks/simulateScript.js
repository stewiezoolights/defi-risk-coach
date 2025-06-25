const { simulateScript } = require("@chainlink/functions-toolkit")
const path = require("path")
const process = require("process")

task("functions-simulate-script", "Executes the JavaScript source code locally")
  .addOptionalParam(
    "configpath",
    "Path to Functions request config file",
    `${__dirname}/../Functions-request-config.js`,
    types.string
  )
  .setAction(async (taskArgs) => {
    const configPath = path.isAbsolute(taskArgs.configpath)
      ? taskArgs.configpath
      : path.join(process.cwd(), taskArgs.configpath)

    const requestConfig = require(configPath)

    const { responseBytesHexstring, errorString, capturedTerminalOutput } = await simulateScript(requestConfig)

    console.log(`${capturedTerminalOutput}\n`)

    if (responseBytesHexstring) {
      console.log("📦 Encoded response (hex):")
      console.log(responseBytesHexstring)
      console.log("\n🔎 Use decodeResult() or ethers locally to parse this.")
    }

    if (errorString) {
      console.log(`❌ Error from simulated script:\n${errorString}\n`)
    }
  })
