// Import ethers 6 in Deno-style
const { ethers } = await import("npm:ethers@6.10.0")

const userCount = parseInt(args[0])
const userAddresses = []
const lockStatuses = []

for (let i = 0; i < userCount; i++) {
  const user = args[1 + i]
  userAddresses.push(user)

  const offset = 1 + userCount + i * 4
  const maxLossPercent = parseInt(args[offset])
  const maxLossCount = parseInt(args[offset + 1])
  const maxTrades = parseInt(args[offset + 2])
  const timeframeHours = parseInt(args[offset + 3])

  const query = `
    query {
      trades(where: { account: "${user.toLowerCase()}" }) {
        pnl
        timestamp
      }
    }
  `

  const response = await Functions.makeHttpRequest({
    url: "https://api.perennial.foundation/subgraphs/perennial-sepolia",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: { query },
  })

  if (!response || response.error) {
    console.log(`❌ Failed to fetch trades for ${user}`)
    lockStatuses.push(false)
    continue
  }

  const trades = response.data?.data?.trades || []
  const since = Math.floor(Date.now() / 1000) - timeframeHours * 3600
  const recent = trades.filter((t) => parseInt(t.timestamp) >= since)

  let lossCount = 0
  let breach = false

  for (const trade of recent) {
    const pnl = parseFloat(trade.pnl)
    if (pnl < 0) {
      lossCount++
      if (Math.abs(pnl) * 100 > maxLossPercent) {
        breach = true
      }
    }
  }

  if (lossCount > maxLossCount || recent.length > maxTrades) {
    breach = true
  }

  console.log(`👤 ${user} | Losses: ${lossCount} | Trades: ${recent.length} | Breach: ${breach}`)
  lockStatuses.push(breach)
}

// ✅ Encode return value using ethers@6 and return bytes
const abiCoder = ethers.AbiCoder.defaultAbiCoder()
const encodedData = abiCoder.encode(["address[]", "bool[]"], [userAddresses, lockStatuses])
return ethers.getBytes(encodedData)
