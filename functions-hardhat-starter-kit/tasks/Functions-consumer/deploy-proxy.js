const { writeDeployment } = require("../utils/writeDeployment")

task("deploy-proxy", "Deploys RiskCooldownProxy contract")
  .addParam("eliza", "Eliza agent address")
  .addParam("risklock", "Deployed RiskLock address")
  .setAction(async (taskArgs, hre) => {
    const net = hre.network.name
    const factory = await hre.ethers.getContractFactory("contracts/RiskCooldownProxy.sol:RiskCooldownProxy")
    const contract = await factory.deploy(taskArgs.eliza, taskArgs.risklock)
    await contract.deployed()
    console.log("✅ RiskCooldownProxy deployed at:", contract.address)
    writeDeployment(net, "RiskCooldownProxy", contract.address)
  })
