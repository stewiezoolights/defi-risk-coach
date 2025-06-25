// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Guardian {
    address public owner;
    mapping(address => bool) public guardians;

    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function addGuardian(address guardian) external onlyOwner returns (bool) {
        guardians[guardian] = true;
        emit GuardianAdded(guardian);
        return true;
    }

    function removeGuardian(address guardian) external onlyOwner returns (bool) {
        guardians[guardian] = false;
        emit GuardianRemoved(guardian);
        return true;
    }

    function isGuardian(address caller) external view returns (bool) {
        return guardians[caller];
    }
}