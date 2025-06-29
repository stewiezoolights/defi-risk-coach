const { ethers } = await import("npm:ethers@6.10.0")

const userCount = parseInt(args[0], 10)
const userAddresses = []
const lockStatuses = []

for (let i = 0; i < userCount; i++) {
  const user = args[1 + i]
  userAddresses.push(user)

  // each user’s params: maxLossPercent, maxLossCount, maxTrades, timeframeHours
  const offset = 1 + userCount + i * 4
  const maxLossPercent = parseInt(args[offset], 10)
  const maxLossCount = parseInt(args[offset + 1], 10)
  const maxTrades = parseInt(args[offset + 2], 10)
  const timeframeHours = parseInt(args[offset + 3], 10)

  // cutoff timestamp
  const since = Math.floor(Date.now() / 1000) - timeframeHours * 3600

  // your confirmed working GraphQL query
  const query = `
    query AccountOrders($account: String!) {
      orders(
        where: { account: $account }
        orderBy: oracleVersion__timestamp
        orderDirection: desc
        first: 1000
        skip: 0
      ) {
        oracleVersion { timestamp }
        market { id }
        long
        short
        accumulation { metadata_net }
      }
    }
  `
  const variables = { account: user.toLowerCase() }

  // fetch all orders
  const response = await Functions.makeHttpRequest({
    url: "https://api.perennial.foundation/subgraphs/perennial-sepolia",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: { query, variables },
  })

  if (!response || response.error) {
    console.log(`❌ Failed to fetch orders for ${user}`)
    lockStatuses.push(false)
    continue
  }

  // filter client‐side by timestamp
  const orders = (response.data?.data?.orders || []).filter((o) => parseInt(o.oracleVersion.timestamp, 10) >= since)

  // only keep the “close” events:
  const closes = orders.filter((o) => parseInt(o.long, 10) < 0 || parseInt(o.short, 10) < 0)
  let lossCount = 0
  let breach = false

  for (const o of closes) {
    const pnl = parseFloat(o.accumulation.metadata_net)
    if (pnl < 0) {
      lossCount++
      if (Math.abs(pnl) * 100 > maxLossPercent) breach = true
    }
  }

  // check counts
  if (lossCount > maxLossCount || orders.length > maxTrades) breach = true

  console.log(`👤 ${user} | Losses: ${lossCount} | Trades: ${orders.length} | Breach: ${breach}`)
  lockStatuses.push(breach)
}

// encode and return [addresses, lockStatuses]
const abiCoder = ethers.AbiCoder.defaultAbiCoder()
const encoded = abiCoder.encode(["address[]", "bool[]"], [userAddresses, lockStatuses])
return ethers.getBytes(encoded)
