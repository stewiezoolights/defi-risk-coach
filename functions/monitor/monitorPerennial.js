const { ethers } = require("ethers");
const { request, gql } = require("graphql-request");

const SUBGRAPH_URL =
  "https://api.perennial.foundation/subgraphs/perennial-sepolia";

module.exports = async (args) => {
  const [walletAddress, riskLockAddress] = args;

  // Initialize provider (Functions provides `secrets` or context here)
  const provider = new ethers.providers.JsonRpcProvider(); // Replace with actual injected provider if available
  const abi = [
    "function getUserParameters(address user) view returns (uint256 maxLossPercent, uint256 maxLossCount, uint256 maxTrades, uint256 timeWindowHours)",
  ];
  const riskLock = new ethers.Contract(riskLockAddress, abi, provider);

  const params = await riskLock.getUserParameters(walletAddress);
  const [maxLossPercent, maxLossCount, maxTrades, timeWindowHours] = params;

  const sinceTimestamp = Math.floor(Date.now() / 1000) - timeWindowHours * 3600;

  const query = gql`
    {
      trades(where: {
        account: "${walletAddress.toLowerCase()}",
        timestamp_gte: ${sinceTimestamp}
      }) {
        pnl
        timestamp
      }
    }
  `;

  const data = await request(SUBGRAPH_URL, query);
  const trades = data.trades || [];

  let lossCount = 0;
  let breach = false;

  for (const trade of trades) {
    const pnl = parseFloat(trade.pnl);
    if (pnl < 0) {
      lossCount++;
      const lossPercent = Math.abs(pnl) * 100;
      if (lossPercent > maxLossPercent) {
        breach = true;
      }
    }
  }

  if (lossCount > maxLossCount || trades.length > maxTrades) {
    breach = true;
  }

  return Functions.encodeUint256(breach ? 1 : 0);
};
