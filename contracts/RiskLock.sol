// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IGuardian {
    function isGuardian(address caller) external view returns (bool);
}

contract RiskLock {
    struct UserParameters {
        uint256 maxLossPercentPerTrade;
        uint256 maxLossTradesInTimeframe;
        uint256 maxTradesInTimeframe;
        uint256 cooldownDuration;
        uint256 lastUpdated;
        bool isLocked;
        bool guardianApproved;
    }

    mapping(address => UserParameters) public userParams;
    address public guardianContract;
    address public functionsConsumer;
    address public owner;

    event LockUpdated(address indexed user, bool locked);
    event ConsumerUpdated(address newConsumer);
    event ParametersUpdated(address indexed user, UserParameters params);
    event GuardianOverride(address indexed user, bool approved);

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

    function setFunctionsConsumer(address _consumer) external onlyOwner {
        require(functionsConsumer == address(0), "Consumer already set");
        require(_consumer != address(0), "Invalid consumer address");
        functionsConsumer = _consumer;
        emit ConsumerUpdated(_consumer);
    }

    function updateParameters(
        uint256 maxLossPercentPerTrade,
        uint256 maxLossTradesInTimeframe,
        uint256 maxTradesInTimeframe,
        uint256 cooldownDuration
    ) external {
        UserParameters storage params = userParams[msg.sender];

        require(
            !params.isLocked || params.guardianApproved,
            "Cannot update while locked"
        );

        require(
            block.timestamp > params.lastUpdated + 1 days || params.guardianApproved,
            "Must wait 24hrs or get guardian approval"
        );

        userParams[msg.sender] = UserParameters({
            maxLossPercentPerTrade: maxLossPercentPerTrade,
            maxLossTradesInTimeframe: maxLossTradesInTimeframe,
            maxTradesInTimeframe: maxTradesInTimeframe,
            cooldownDuration: cooldownDuration,
            lastUpdated: block.timestamp,
            isLocked: params.isLocked,
            guardianApproved: false
        });

        emit ParametersUpdated(msg.sender, userParams[msg.sender]);
    }

    function updateLockFromFunctions(address user, bool locked) external onlyConsumer {
        userParams[user].isLocked = locked;
        emit LockUpdated(user, locked);
    }

    function guardianUnlock(address user) external {
        require(IGuardian(guardianContract).isGuardian(msg.sender), "Not guardian");
        userParams[user].isLocked = false;
        userParams[user].guardianApproved = false;
        emit LockUpdated(user, false);
    }

    function approveGuardianOverride(address user) external {
        require(IGuardian(guardianContract).isGuardian(msg.sender), "Not guardian");
        userParams[user].guardianApproved = true;
        emit GuardianOverride(user, true);
    }

    function isLocked(address user) external view returns (bool) {
        return userParams[user].isLocked;
    }

    function getUserParameters(address user) external view returns (UserParameters memory) {
        return userParams[user];
    }
}
