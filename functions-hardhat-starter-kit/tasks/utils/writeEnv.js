function writeEnvVariable(key, value) {
  const fs = require("fs")
  const path = require("path")
  const envPath = path.join(__dirname, "..", "..", ".env")

  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""

  const lines = env.split("\n").filter(Boolean)
  const filtered = lines.filter((line) => !line.startsWith(`${key}=`))
  filtered.push(`${key}=${value}`)

  fs.writeFileSync(envPath, filtered.join("\n") + "\n")
  console.log(`🔐 Injected ${key} into .env`)
}

module.exports = { writeEnvVariable } // ✅ Must export this way
