// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Guardian {
    mapping(address => address) public userGuardian; // each user assigns their own guardian

    event GuardianAssigned(address indexed user, address indexed guardian);
    event GuardianRevoked(address indexed user, address indexed guardian);

    /**
     * @notice Assigns a guardian for the caller (user)
     */
    function assignGuardian(address guardian) external {
        require(guardian != address(0), "Invalid guardian");
        userGuardian[msg.sender] = guardian;
        emit GuardianAssigned(msg.sender, guardian);
    }

    /**
     * @notice Revokes guardian for the caller
     */
    function revokeGuardian() external {
        address oldGuardian = userGuardian[msg.sender];
        require(oldGuardian != address(0), "No guardian assigned");
        delete userGuardian[msg.sender];
        emit GuardianRevoked(msg.sender, oldGuardian);
    }

    /**
     * @notice Checks if `caller` is guardian for `user`
     */
    function isGuardianFor(address user, address caller) external view returns (bool) {
        return userGuardian[user] == caller;
    }
}
