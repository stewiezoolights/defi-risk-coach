// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Limiter {

    // Configurable limits (per user)
    struct Limits {
        uint256 maxTradesPerDay;
        int256 maxLossPercent; // e.g. -5000 for -5.00%
        uint256 cooldownPeriod; // seconds
    }

    // User state
    struct UserState {
        uint256 tradeCountToday;
        int256 cumulativePnl; // % based, cumulative today
        uint256 lastTradeTimestamp;
        uint256 lockedUntil;
    }

    address public guardian;

    mapping(address => Limits) public userLimits;
    mapping(address => UserState) public userState;

    event LimitsSet(address indexed user, Limits limits);
    event Locked(address indexed user, uint256 untilTimestamp);
    event Unlocked(address indexed user);
    event TradeRecorded(address indexed user, int256 pnlPercent);

    modifier notLocked(address user) {
        require(block.timestamp >= userState[user].lockedUntil, "Account is currently locked");
        _;
    }

    constructor(address _guardian) {
        guardian = _guardian;
    }

    function setLimits(uint256 _maxTradesPerDay, int256 _maxLossPercent, uint256 _cooldownPeriod) external {
        userLimits[msg.sender] = Limits({
            maxTradesPerDay: _maxTradesPerDay,
            maxLossPercent: _maxLossPercent,
            cooldownPeriod: _cooldownPeriod
        });
        emit LimitsSet(msg.sender, userLimits[msg.sender]);
    }

    // This should be called after each trade by the DApp or a trusted relayer
    function recordTrade(int256 pnlPercent) external notLocked(msg.sender) {
        UserState storage state = userState[msg.sender];
        Limits storage limits = userLimits[msg.sender];

        // Reset trade count if new day
        if (block.timestamp / 1 days > state.lastTradeTimestamp / 1 days) {
            state.tradeCountToday = 0;
            state.cumulativePnl = 0;
        }

        state.tradeCountToday += 1;
        state.cumulativePnl += pnlPercent;
        state.lastTradeTimestamp = block.timestamp;

        emit TradeRecorded(msg.sender, pnlPercent);

        // Check limits
        if (state.tradeCountToday > limits.maxTradesPerDay || state.cumulativePnl <= limits.maxLossPercent) {
            // Lock account
            state.lockedUntil = block.timestamp + limits.cooldownPeriod;
            emit Locked(msg.sender, state.lockedUntil);
        }
    }

    // View function to check if user is currently locked
    function isLocked(address user) external view returns (bool) {
        return block.timestamp < userState[user].lockedUntil;
    }

    // Emergency unlock (guardian only)
    function emergencyUnlock(address user) external {
        require(msg.sender == guardian, "Only guardian can unlock");
        userState[user].lockedUntil = block.timestamp;
        emit Unlocked(user);
    }
}
