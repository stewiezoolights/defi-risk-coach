const axios = require("axios");

module.exports = async (args) => {
  const {
    walletAddress,
    maxLossPercentPerTrade,
    maxLossTradesInTimeframe,
    maxTradesInTimeframe,
    timeframeHours,
  } = args;

  const now = Math.floor(Date.now() / 1000);
  const sinceTimestamp = now - timeframeHours * 60 * 60;

  const query = `
    {
      trades(where: {trader: "${walletAddress.toLowerCase()}", timestamp_gt: ${sinceTimestamp}}) {
        id
        pnl
        timestamp
      }
    }
  `;

  const response = await axios.post(
    "https://api.perennial.foundation/subgraphs/name/perennial-sepolia",
    { query },
    { headers: { "Content-Type": "application/json" } }
  );

  const trades = response.data.data.trades;
  let totalTrades = trades.length;
  let lossTrades = 0;
  let breachedLossPercent = false;

  for (const trade of trades) {
    const pnl = parseFloat(trade.pnl);
    if (pnl < 0) {
      lossTrades++;
      if (pnl <= -Math.abs(maxLossPercentPerTrade)) {
        breachedLossPercent = true;
      }
    }
  }

  const shouldLock =
    breachedLossPercent ||
    lossTrades > maxLossTradesInTimeframe ||
    totalTrades > maxTradesInTimeframe;

  return Functions.encodeUint256(shouldLock ? 1 : 0);
};
