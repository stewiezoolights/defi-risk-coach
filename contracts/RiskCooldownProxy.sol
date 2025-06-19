// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRiskLock {
    function updateLockFromFunctions(bool locked) external;
    function isLocked() external view returns (bool);
}

contract RiskCooldownProxy {
    struct LockInfo {
        uint256 unlockTimestamp;
        bool isActive;
    }

    mapping(address => LockInfo) public locks;
    address public immutable elizaAgent;
    IRiskLock public immutable riskLock;

    event LockTriggered(address indexed user, uint256 unlockTime);
    event AutoUnlockPerformed(address indexed user);

    constructor(address _elizaAgent, address _riskLock) {
        require(_elizaAgent != address(0), "Invalid Eliza agent");
        require(_riskLock != address(0), "Invalid RiskLock address");
        elizaAgent = _elizaAgent;
        riskLock = IRiskLock(_riskLock);
    }

    modifier onlyEliza() {
        require(msg.sender == elizaAgent, "Caller is not Eliza");
        _;
    }

    /// @notice Called by ElizaOS to initiate lock with cooldown
    function onLockTriggered(address user, uint256 cooldownSeconds) external onlyEliza {
        require(user != address(0), "Invalid user");
        require(cooldownSeconds > 0, "Cooldown must be > 0");

        uint256 unlockAt = block.timestamp + cooldownSeconds;
        locks[user] = LockInfo({
            unlockTimestamp: unlockAt,
            isActive: true
        });

        riskLock.updateLockFromFunctions(true);
        emit LockTriggered(user, unlockAt);
    }

    /// @notice Chainlink Automation check to see if any cooldowns have expired
    function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory performData) {
        if (locks[tx.origin].isActive && block.timestamp >= locks[tx.origin].unlockTimestamp) {
            return (true, abi.encode(tx.origin));
        }
        return (false, bytes(""));
    }

    /// @notice Chainlink Automation executes unlocks
    function performUpkeep(bytes calldata performData) external {
        address user = abi.decode(performData, (address));
        LockInfo storage info = locks[user];

        require(info.isActive, "No active lock");
        require(block.timestamp >= info.unlockTimestamp, "Cooldown not over");

        info.isActive = false;
        riskLock.updateLockFromFunctions(false);
        emit AutoUnlockPerformed(user);
    }

    /// @notice Manual read for frontends or Eliza
    function getCooldownRemaining(address user) external view returns (uint256 secondsLeft) {
        LockInfo memory info = locks[user];
        if (!info.isActive || block.timestamp >= info.unlockTimestamp) {
            return 0;
        }
        return info.unlockTimestamp - block.timestamp;
    }
}
