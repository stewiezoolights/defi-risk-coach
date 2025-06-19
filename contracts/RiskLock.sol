// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title RiskLock - A locking mechanism governed by a Chainlink Functions consumer and guardian contract
/// @notice Initially deployed with only the guardian; the FunctionsConsumer address is set once post-deploy
/// @dev Designed for extensibility, e.g. ElizaOS AI agents via proxy adapter in the future

interface IGuardian {
    function isGuardian(address caller) external view returns (bool);
}

contract RiskLock {
    address public guardianContract;
    address public functionsConsumer;
    bool public isLocked;
    address public owner;

    event LockUpdated(bool locked);
    event ConsumerUpdated(address newConsumer);

    modifier onlyConsumer() {
        require(msg.sender == functionsConsumer, "Not FunctionsConsumer");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _guardianContract) {
        require(_guardianContract != address(0), "Invalid guardian address");
        guardianContract = _guardianContract;
        owner = msg.sender;
    }

    /// @notice One-time setup for the address that can call `updateLockFromFunctions`
    /// @dev Only callable once by the owner. Prevents overwriting the consumer address.
    function setFunctionsConsumer(address _consumer) external onlyOwner {
        require(functionsConsumer == address(0), "Consumer already set");
        require(_consumer != address(0), "Invalid consumer address");
        functionsConsumer = _consumer;
        emit ConsumerUpdated(_consumer);
    }

    /// @notice Called by the authorized Functions consumer (e.g. Chainlink or ElizaOS agent) to update lock status
    function updateLockFromFunctions(bool locked) external onlyConsumer {
        isLocked = locked;
        emit LockUpdated(locked);
    }

    /// @notice Emergency unlock via guardian account
    function guardianUnlock() external {
        require(IGuardian(guardianContract).isGuardian(msg.sender), "Not guardian");
        isLocked = false;
        emit LockUpdated(false);
    }
}
