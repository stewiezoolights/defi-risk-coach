const fs = require("fs")
const path = require("path")

function writeDeployment(network, contractName, address) {
  const dir = path.join(__dirname, "..", "deployments")
  const file = path.join(dir, `${network}.json`)

  if (!fs.existsSync(dir)) fs.mkdirSync(dir)

  let data = {}
  if (fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file))
  }

  data[contractName] = address
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  console.log(`📝 Saved ${contractName} at ${address} to deployments/${network}.json`)
}

module.exports = { writeDeployment }
