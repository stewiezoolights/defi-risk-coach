// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRiskCooldownProxy {
  function isCooldownComplete(address user) external view returns (bool);
  function getCooldownDuration(address user) external view returns (uint256);
}

interface IGuardian {
  function isGuardian(address user) external view returns (bool);
}

contract RiskLock {
  mapping(address => bool) public isLocked;

  address public riskFunctionsConsumer;
  IRiskCooldownProxy public cooldownProxy;
  IGuardian public immutable guardian;
  address public owner;

  event Locked(address indexed user, uint256 timestamp);
  event Unlocked(address indexed user, uint256 timestamp);
  event ParametersUpdated(address indexed user);
  event MonitorRequested(address indexed user);
  event ConsumerSet(address indexed consumer);
  event CooldownProxySet(address indexed proxy);

  struct Parameters {
    uint256 maxLossPercent;
    uint256 maxLossCount;
    uint256 maxTrades;
    uint256 timeframeHours;
    uint256 cooldownDuration;
    uint256 lastUpdated;
  }

  mapping(address => Parameters) public userParameters;

  modifier onlyConsumer() {
    require(msg.sender == riskFunctionsConsumer, "Not authorized");
    _;
  }

  modifier onlyGuardian() {
    require(guardian.isGuardian(msg.sender), "Not a guardian");
    _;
  }

  constructor(
    address _consumer,
    address _cooldownProxy,
    address _guardian
  ) {
    riskFunctionsConsumer = _consumer;
    cooldownProxy = IRiskCooldownProxy(_cooldownProxy);
    guardian = IGuardian(_guardian);
    owner = msg.sender;
  }

  /**
   * @notice Allows the owner to set or update the authorized RiskFunctionsConsumer address.
   */
  function setConsumer(address _consumer) external {
    require(msg.sender == owner, "Only owner can set consumer");
    require(_consumer != address(0), "Invalid consumer address");
    riskFunctionsConsumer = _consumer;
    emit ConsumerSet(_consumer);
  }

  /**
   * @notice Allows the owner to set or update the RiskCooldownProxy address.
   */
  function setCooldownProxy(address _proxy) external {
    require(msg.sender == owner, "Only owner can set proxy");
    require(_proxy != address(0), "Invalid proxy address");
    cooldownProxy = IRiskCooldownProxy(_proxy);
    emit CooldownProxySet(_proxy);
  }

  // --- Core Locking ---

  function updateLockFromFunctions(address user, bool locked) external onlyConsumer {
    if (locked) {
      isLocked[user] = true;
      emit Locked(user, block.timestamp);
      emit MonitorRequested(user); // Signal ElizaOS
    }
  }

  function unlockAfterCooldown() external {
    require(isLocked[msg.sender], "Not locked");
    require(cooldownProxy.isCooldownComplete(msg.sender), "Cooldown not complete");

    isLocked[msg.sender] = false;
    emit Unlocked(msg.sender, block.timestamp);
  }

  function forceUnlock(address user) external onlyGuardian {
    require(isLocked[user], "User not locked");

    isLocked[user] = false;
    emit Unlocked(user, block.timestamp);
  }

  function canUnlock(address user) external view returns (bool) {
    return isLocked[user] && cooldownProxy.isCooldownComplete(user);
  }

  // --- User Parameters Configuration ---

  function setParameters(
    uint256 maxLossPercent,
    uint256 maxLossCount,
    uint256 maxTrades,
    uint256 timeframeHours,
    uint256 cooldownDuration
  ) external {
    require(!isLocked[msg.sender], "Cannot update while locked");

    // Optional: enforce minimums / maximums
    require(maxLossPercent > 0 && maxLossPercent <= 100, "Invalid % loss");
    require(maxLossCount > 0 && maxLossCount <= 20, "Too many losses");
    require(maxTrades > 0 && maxTrades <= 100, "Too many trades");
    require(timeframeHours >= 1 && timeframeHours <= 168, "Timeframe out of bounds"); // up to 1 week
    require(cooldownDuration >= 1 hours && cooldownDuration <= 30 days, "Invalid cooldown");

    userParameters[msg.sender] = Parameters({
      maxLossPercent: maxLossPercent,
      maxLossCount: maxLossCount,
      maxTrades: maxTrades,
      timeframeHours: timeframeHours,
      cooldownDuration: cooldownDuration,
      lastUpdated: block.timestamp
    });

    emit ParametersUpdated(msg.sender);
    emit MonitorRequested(msg.sender); // optional: trigger ElizaOS nudge when limits are set
  }

  function getUserParameters(address user) external view returns (
    uint256 maxLossPercent,
    uint256 maxLossCount,
    uint256 maxTrades,
    uint256 timeframeHours,
    uint256 cooldownDuration
  ) {
    Parameters memory p = userParameters[user];
    return (
      p.maxLossPercent,
      p.maxLossCount,
      p.maxTrades,
      p.timeframeHours,
      p.cooldownDuration
    );
  }
}
