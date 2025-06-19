# Defi Risk Coach 🛡️ - Chainlink Hackathon 2025 🚀

**Project Theme:** Helping crypto traders mitigate gambling behavior behaviors & manage risk using decentralized tools.

**Project Scope:**  
A smart contract system designed to mitigate compulsive trading behavior by using Chainlink Functions, Chainlink Automation, and ElizaOS AI to monitor DeFi trader performance (e.g. % PnL, trade count) and enforce wallet cooldowns when risk thresholds are exceeded.

---

## ✨ Features

- 🧠 **AI Coach (ElizaOS)**: Personalized interaction & behavioral nudging
- 🔍 **On-Chain Risk Contracts**: Trade limits, lock wallets, guardian-controlled unlocks
- ⛓️ **Chainlink Functions**: Monitors user DEX activity and off-chain metrics
- ⛓️ **Chainlink Automation**: Monitors user DEX activity and off-chain metrics
- 🌐 **Frontend App**: Simple wallet interface to configure and monitor risk settings

---

## 🗺️ Architecture

- React frontend → AI Coach → Chainlink Functions → Smart Contracts → DEX Data

**Flow Explanation:**

1️⃣ User connects wallet and configures limits via the frontend.  
2️⃣ AI Coach provides real-time behavioral feedback and nudges.  
3️⃣ Chainlink Functions monitors user trading activity offchain and onchain.  
4️⃣ Smart contracts enforce time-based wallet locks and configurable limits.  
5️⃣ A guardian wallet can assist in emergency unlocks.

---

## ⚙️ Tech Stack

- Solidity (Smart Contracts)
- Chainlink Functions (DEX monitoring)
- React + Vite (Frontend)
- ElizaOS AI Agent (Coaching)
- Hardhat (Deployment)
- Ethers.js (Blockchain interactions)

---

## 🚢 Project Components

| Contract                  | Description                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Guardian`                | Allows approved accounts to unlock wallets in emergencies                                                                                   |
| `RiskLock`                | Central lock contract that disables trader activity under set conditions                                                                    |
| `RiskFunctionsConsumer`   | Chainlink Functions consumer fetching trader stats from the Perennial subgraph                                                              |
| Frontend                  | React/Vite UI where users can enter wallet address and set risk parameters                                                                  |
| Chainlink Source Script   | Custom script to pull user trading data from the [Perennial Sepolia Subgraph](https://api.perennial.foundation/subgraphs/perennial-sepolia) |
| ElizaOS Agent _(planned)_ | Future integration to guide traders via coaching after lock activation                                                                      |

---

## 🚢 Ship It!

### ✅ Prerequisites

- Node.js (v18+)
- npm
- Git

### 📦 Install Project Dependencies

```bash
npm install
npm install --save-dev hardhat
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install --save-dev hardhat-contract-sizer
npm install @chainlink/contracts
npm install @chainlink/functions-toolkit
npm install ethers@6
npm install dotenv

```
