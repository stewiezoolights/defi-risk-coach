// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRiskLock {
    function updateLockFromFunctions(address user, bool locked) external;
    function isLocked(address user) external view returns (bool);
    function getUserParameters(address user) external view returns (
        uint256 maxLossPercent,
        uint256 maxLossCount,
        uint256 maxTrades,
        uint256 timeframeHours,
        uint256 cooldownDuration
    );
}

contract RiskCooldownProxy {
    struct LockInfo {
        uint256 unlockTimestamp;
        bool isActive;
    }

    mapping(address => LockInfo) public locks;
    address public immutable elizaAgent;
    IRiskLock public immutable riskLock;
    address public owner;
    address public riskFunctionsConsumer;

    event LockTriggered(address indexed user, uint256 unlockTime);
    event AutoUnlockPerformed(address indexed user);
    event ConsumerSet(address indexed consumer);

    constructor(address _elizaAgent, address _riskLock) {
        require(_elizaAgent != address(0), "Invalid Eliza agent");
        require(_riskLock != address(0), "Invalid RiskLock address");
        elizaAgent = _elizaAgent;
        riskLock = IRiskLock(_riskLock);
        owner = msg.sender;
    }

    modifier onlyAuthorizedCaller() {
        require(
            msg.sender == elizaAgent || msg.sender == riskFunctionsConsumer,
            "Caller is not authorized"
        );
        _;
    }

    /**
     * @notice Allows the owner to set the authorized RiskFunctionsConsumer contract address.
     */
    function setConsumer(address _consumer) external {
        require(msg.sender == owner, "Only owner can set consumer");
        require(_consumer != address(0), "Invalid consumer address");
        riskFunctionsConsumer = _consumer;
        emit ConsumerSet(_consumer);
    }

    /**
     * @notice Initiates a user's cooldown period. Can be called by Eliza or the Functions Consumer.
     */
    function triggerCooldown(address user) external onlyAuthorizedCaller {
        require(user != address(0), "Invalid user");

        // Pull cooldown duration from RiskLock
        (, , , , uint256 cooldownDuration) = riskLock.getUserParameters(user);
        require(cooldownDuration > 0, "Cooldown not configured");

        uint256 unlockAt = block.timestamp + cooldownDuration;
        locks[user] = LockInfo(unlockAt, true);

        riskLock.updateLockFromFunctions(user, true);
        emit LockTriggered(user, unlockAt);
    }

    /// Chainlink Automation-compatible interface to unlock the trader's wallet
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData) {
        address user = abi.decode(checkData, (address));
        LockInfo memory info = locks[user];

        if (info.isActive && block.timestamp >= info.unlockTimestamp) {
            return (true, abi.encode(user));
        }

        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external {
        address user = abi.decode(performData, (address));
        LockInfo storage info = locks[user];

        require(info.isActive, "No active lock");
        require(block.timestamp >= info.unlockTimestamp, "Cooldown not finished");

        info.isActive = false;
        riskLock.updateLockFromFunctions(user, false);
        emit AutoUnlockPerformed(user);
    }

    function getCooldownRemaining(address user) external view returns (uint256) {
        LockInfo memory info = locks[user];
        if (!info.isActive || block.timestamp >= info.unlockTimestamp) {
            return 0;
        }
        return info.unlockTimestamp - block.timestamp;
    }

    /// ElizaOS off-chain hook for decision making
    function getUserState(address user) external view returns (
        bool locked,
        uint256 unlockIn,
        bool canAutoUnlock
    ) {
        LockInfo memory info = locks[user];
        bool isCurrentlyLocked = riskLock.isLocked(user);
        bool expired = block.timestamp >= info.unlockTimestamp;
        return (
            isCurrentlyLocked,
            expired ? 0 : info.unlockTimestamp - block.timestamp,
            info.isActive && expired
        );
    }
}
