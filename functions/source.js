// Chainlink Functions source: evaluate user risk from Perennial subgraph
const userAddress = args[0];
const lossThreshold = parseFloat(args[1]); // in %, e.g., 10 for 10%
const cooldownThreshold = parseInt(args[2]); // seconds

const query = `
  {
    account(id: "${userAddress.toLowerCase()}") {
      realizedPnl
      unrealizedPnl
      lastTradeTimestamp
    }
  }
`;

const response = await Functions.makeHttpRequest({
  url: "https://api.perennial.foundation/subgraphs/perennial-sepolia",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  data: { query },
});

if (!response.data || !response.data.data || !response.data.data.account) {
  throw new Error("Failed to fetch user data");
}

const account = response.data.data.account;

// Compute % loss (if any)
const totalPnl =
  parseFloat(account.realizedPnl) + parseFloat(account.unrealizedPnl);
const exceededLoss = totalPnl < 0 && Math.abs(totalPnl) > lossThreshold;

// Check if cooldown has passed
const now = Math.floor(Date.now() / 1000);
const lastTrade = parseInt(account.lastTradeTimestamp);
const underCooldown = now - lastTrade < cooldownThreshold;

// Encode both flags in result (1 = true, 0 = false)
return (
  Functions.encodeUint256(exceededLoss ? 1 : 0) +
  Functions.encodeUint256(underCooldown ? 1 : 0)
);
