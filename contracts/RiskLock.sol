// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RiskLock {

    address public owner;
    address public guardian;

    uint256 public maxTradesPerDay;
    int256 public maxDailyPnLLoss; // PnL loss threshold (negative value expected)
    uint256 public cooldownPeriod;
    uint256 public lockPeriod;

    uint256 public lastTradeTimestamp;
    uint256 public tradeCountToday;
    int256 public dailyPnL;

    bool public isLocked;
    uint256 public lockUntil;

    event LockActivated(uint256 lockUntil);
    event LockDeactivated();
    event GuardianOverride();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian, "Not guardian");
        _;
    }

    constructor(
        address _guardian,
        uint256 _maxTradesPerDay,
        int256 _maxDailyPnLLoss,
        uint256 _cooldownPeriod,
        uint256 _lockPeriod
    ) {
        owner = msg.sender;
        guardian = _guardian;
        maxTradesPerDay = _maxTradesPerDay;
        maxDailyPnLLoss = _maxDailyPnLLoss;
        cooldownPeriod = _cooldownPeriod;
        lockPeriod = _lockPeriod;
    }

    function updateLimits(
        uint256 _maxTradesPerDay,
        int256 _maxDailyPnLLoss,
        uint256 _cooldownPeriod,
        uint256 _lockPeriod
    ) external onlyOwner {
        maxTradesPerDay = _maxTradesPerDay;
        maxDailyPnLLoss = _maxDailyPnLLoss;
        cooldownPeriod = _cooldownPeriod;
        lockPeriod = _lockPeriod;
    }

    // Called by Chainlink Function (or manually for testing)
    function updateTradingActivity(
        uint256 tradesToday,
        int256 pnlToday
    ) external onlyOwner {
        tradeCountToday = tradesToday;
        dailyPnL = pnlToday;

        // Check limits
        if (tradesToday > maxTradesPerDay || pnlToday <= maxDailyPnLLoss) {
            _activateLock();
        }
    }

    function _activateLock() internal {
        isLocked = true;
        lockUntil = block.timestamp + lockPeriod;
        emit LockActivated(lockUntil);
    }

    function checkUnlock() external {
        require(isLocked, "Not locked");
        if (block.timestamp >= lockUntil) {
            isLocked = false;
            emit LockDeactivated();
        }
    }

    function guardianOverrideUnlock() external onlyGuardian {
        isLocked = false;
        emit GuardianOverride();
    }
}
