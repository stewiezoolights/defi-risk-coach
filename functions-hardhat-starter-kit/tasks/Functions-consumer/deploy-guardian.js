const { writeDeployment } = require("../utils/writeDeployment")

task("deploy-guardian", "Deploys the Guardian contract").setAction(async (taskArgs, hre) => {
  const net = hre.network.name
  const factory = await hre.ethers.getContractFactory("contracts/Gaurdian.sol:Guardian")
  const guardian = await factory.deploy()
  await guardian.deployed()
  console.log("✅ Guardian deployed at:", guardian.address)
  writeDeployment(net, "Guardian", guardian.address)
})
