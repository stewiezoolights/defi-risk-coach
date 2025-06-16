// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IGuardian {
    function isGuardian(address caller) external view returns (bool);
}

contract RiskLock {
    address public guardianContract;
    address public functionsConsumer;
    bool public isLocked;

    event LockUpdated(bool locked);

    modifier onlyConsumer() {
        require(msg.sender == functionsConsumer, "Not FunctionsConsumer");
        _;
    }

    constructor(address _guardianContract, address _functionsConsumer) {
        require(_guardianContract != address(0), "Invalid guardian address");
        require(_functionsConsumer != address(0), "Invalid consumer address");
        guardianContract = _guardianContract;
        functionsConsumer = _functionsConsumer;
    }

    function updateLockFromFunctions(bool locked) external onlyConsumer {
        isLocked = locked;
        emit LockUpdated(locked);
    }

    function guardianUnlock() external {
        require(IGuardian(guardianContract).isGuardian(msg.sender), "Not guardian");
        isLocked = false;
        emit LockUpdated(false);
    }
}
