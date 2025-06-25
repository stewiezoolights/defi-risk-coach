const { writeDeployment } = require("../utils/writeDeployment")

task("deploy-risklock", "Deploys the RiskLock contract")
  .addParam("consumer", "Consumer address")
  .addParam("proxy", "CooldownProxy address")
  .addParam("guardian", "Guardian address")
  .setAction(async (taskArgs, hre) => {
    const net = hre.network.name
    if (/^0x0{40}$/i.test(taskArgs.consumer)) {
      throw new Error("❌ Must provide a valid RiskFunctionsConsumer address")
    }

    const factory = await hre.ethers.getContractFactory("contracts/RiskLock.sol:RiskLock")
    const contract = await factory.deploy(taskArgs.consumer, taskArgs.proxy, taskArgs.guardian)
    await contract.deployed()
    console.log("✅ RiskLock deployed at:", contract.address)
    writeDeployment(net, "RiskLock", contract.address)
  })
