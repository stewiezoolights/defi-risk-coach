const { request, gql } = require("graphql-request");

const SUBGRAPH_URL =
  "https://api.perennial.foundation/subgraphs/perennial-sepolia";

module.exports = async (args) => {
  const userCount = parseInt(args[0]);
  const results = [];

  for (let i = 0; i < userCount; i++) {
    const user = args[1 + i];

    const query = gql`
      {
        trades(where: { account: "${user.toLowerCase()}" }) {
          pnl
          timestamp
        }
      }
    `;

    try {
      const data = await request(SUBGRAPH_URL, query);
      const trades = data.trades || [];

      // Simulate pulling parameters from on-chain for this user
      const maxLossPercent = parseInt(args[1 + userCount + i * 4]);
      const maxLossCount = parseInt(args[2 + userCount + i * 4]);
      const maxTrades = parseInt(args[3 + userCount + i * 4]);
      const timeframeHours = parseInt(args[4 + userCount + i * 4]);

      const sinceTimestamp =
        Math.floor(Date.now() / 1000) - timeframeHours * 3600;
      const recentTrades = trades.filter(
        (t) => parseInt(t.timestamp) >= sinceTimestamp
      );

      let lossCount = 0;
      let breach = false;

      for (const trade of recentTrades) {
        const pnl = parseFloat(trade.pnl);
        if (pnl < 0) {
          lossCount++;
          if (Math.abs(pnl) * 100 > maxLossPercent) {
            breach = true;
          }
        }
      }

      if (lossCount > maxLossCount || recentTrades.length > maxTrades) {
        breach = true;
      }

      results.push({
        user,
        breached: breach,
        lossCount,
        totalTrades: recentTrades.length,
        maxLossPercent,
        maxLossCount,
        maxTrades,
        timeframeHours,
      });
    } catch (err) {
      results.push({ user, error: err.message });
    }
  }

  return Functions.encodeString(JSON.stringify(results));
};
