const { getDecodedResultLog } = require("@chainlink/functions-toolkit");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const consumerAddress = process.env.FUNCTIONS_CONSUMER_ADDRESS;
  if (!consumerAddress)
    throw new Error("❌ FUNCTIONS_CONSUMER_ADDRESS not set in .env");

  // Load args from JSON
  const argsPath = path.resolve(__dirname, "../../requests/args.json");
  const args = JSON.parse(fs.readFileSync(argsPath, "utf8"));

  const source = fs.readFileSync(
    path.resolve(__dirname, "./monitorPerennial.js"),
    "utf8"
  );

  const requestConfig = {
    source: source.toString(),
    args,
    secrets: {}, // If needed later for auth headers, etc.
    expectedReturnType: "uint256",
  };

  console.log("⏳ Sending Chainlink Functions request...");

  const consumer = await hre.ethers.getContractAt(
    "RiskFunctionsConsumer",
    consumerAddress
  );
  const tx = await consumer.sendRequest(
    requestConfig.source,
    requestConfig.args,
    [],
    requestConfig.expectedReturnType
  );

  const receipt = await tx.wait();
  console.log("✅ Request sent. Tx hash:", receipt.transactionHash);

  const log = getDecodedResultLog(receipt);
  if (log) {
    console.log("📊 Function result:", log.result);
  } else {
    console.warn("⚠️ No result log found");
  }
}

main().catch((err) => {
  console.error("❌ Request failed:", err);
  process.exitCode = 1;
});
