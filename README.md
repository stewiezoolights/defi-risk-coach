# Defi Risk Coach 🛡️ - Chainlink Hackathon 2025 🚀

**Project Theme:** Helping crypto traders mitigate gambling behaviors & manage risk using decentralized tools.

**Project Summary:**  
DeFi Risk Coach is an on-chain + off-chain solution that monitors user trading behavior and applies intelligent limits & coaching. Users can voluntarily set limits (trades/day, max loss, cooldowns), and the system enforces them via smart contracts and AI-based coaching conversations.

---

## ✨ Features

- 🧠 **AI Coach (ElizaOS)**: Personalized interaction & behavioral nudging
- ⛓️ **On-Chain Risk Contracts**: Trade limits, lock wallets, guardian-controlled unlocks
- 🔍 **Chainlink Functions**: Monitors user DEX activity and off-chain metrics
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
