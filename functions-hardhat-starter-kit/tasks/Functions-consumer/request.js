const { buildRequestConfig } = require("../../Functions-request-config")

task("functions-request", "Send real Chainlink Functions request")
  .addParam("contract", "Deployed RiskFunctionsConsumer")
  .addParam("subid", "Your Chainlink subscription ID")
  .setAction(async (taskArgs, hre) => {
    const consumer = await hre.ethers.getContractAt("RiskFunctionsConsumer", taskArgs.contract)
    const config = await buildRequestConfig()

    const tx = await consumer.sendRiskCheckRequest(
      config.source,
      config.secretsLocation,
      config.encryptedSecretsReference,
      config.args,
      config.bytesArgs,
      parseInt(taskArgs.subid),
      config.callbackGasLimit
    )

    const receipt = await tx.wait()
    console.log("✅ Request sent:", receipt.transactionHash)
  })
