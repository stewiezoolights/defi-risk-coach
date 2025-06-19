const fs = require("fs");
const readline = require("readline");
const path = require("path");

const exampleEnvPath = path.resolve(__dirname, ".env.example");
const targetEnvPath = path.resolve(__dirname, ".env");

const DEFAULTS = {
  CHAINLINK_FUNCTIONS_ROUTER: "0xf9B8fc078197181C841c296C876945aaa425B278", // Base Sepolia router
  DON_ID: "fun-base-sepolia-1",
};

async function prompt(question, defaultValue = "") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const message = defaultValue
    ? `${question} (Press Enter for default: ${defaultValue}): `
    : `${question}: `;
  return new Promise((resolve) =>
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    })
  );
}

async function initEnv() {
  if (!fs.existsSync(exampleEnvPath)) {
    console.error("❌ .env.example not found.");
    process.exit(1);
  }

  const lines = fs.readFileSync(exampleEnvPath, "utf8").split("\n");
  const outputLines = [];

  for (const line of lines) {
    if (line.trim().startsWith("#") || line.trim() === "") {
      outputLines.push(line);
    } else {
      const [key] = line.split("=");
      const defaultValue = DEFAULTS[key] || "";
      const answer = await prompt(`Enter value for ${key}`, defaultValue);
      outputLines.push(`${key}=${answer}`);
    }
  }

  fs.writeFileSync(targetEnvPath, outputLines.join("\n"));
  console.log("✅ .env file created successfully!");
}

initEnv();
