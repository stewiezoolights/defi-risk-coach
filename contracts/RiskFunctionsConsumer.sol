// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FunctionsClient } from "node_modules/@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";

interface IRiskLock {
    function updateLockFromFunctions(address user, bool locked) external;
}

contract RiskFunctionsConsumer is FunctionsClient {
    address public owner;
    address public riskLock;
    address public elizaAgent;

    event ResponseReceived(bytes32 indexed requestId, bytes result, bytes err);
    event UserLockEvaluated(address indexed user, bool locked, bool success);
    event RiskLockUpdateFailed(address indexed user, string reason);
    event MonitorRequested(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyEliza() {
        require(msg.sender == elizaAgent, "Not Eliza agent");
        _;
    }

    constructor(address router, address _riskLock, address _elizaAgent)
        FunctionsClient(router)
    {
        require(_riskLock != address(0), "Invalid RiskLock");
        require(_elizaAgent != address(0), "Invalid Eliza agent");
        owner = msg.sender;
        riskLock = _riskLock;
        elizaAgent = _elizaAgent;
    }

    /// @notice Called by Chainlink Functions node
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        emit ResponseReceived(requestId, response, err);

        if (err.length > 0) {
            emit RiskLockUpdateFailed(address(0), string(err));
            return;
        }

        (address[] memory users, bool[] memory locks) = abi.decode(response, (address[], bool[]));
        if (users.length != locks.length) {
            emit RiskLockUpdateFailed(address(0), "Mismatched response array lengths");
            return;
        }

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            bool locked = locks[i];

            try IRiskLock(riskLock).updateLockFromFunctions(user, locked) {
                emit UserLockEvaluated(user, locked, true);
            } catch Error(string memory reason) {
                emit RiskLockUpdateFailed(user, reason);
            } catch {
                emit RiskLockUpdateFailed(user, "Unknown low-level error");
            }
        }
    }

    /// @notice Called by ElizaOS to emit a monitor request
    function triggerBatchMonitor(address user) external onlyEliza {
        emit MonitorRequested(user);
    }

    /// @notice Admin override to update risk lock contract
    function setRiskLock(address _riskLock) external onlyOwner {
        require(_riskLock != address(0), "Invalid address");
        riskLock = _riskLock;
    }

    /// @notice Admin override to update Eliza agent
    function setElizaAgent(address _elizaAgent) external onlyOwner {
        require(_elizaAgent != address(0), "Invalid address");
        elizaAgent = _elizaAgent;
    }

    /// @notice Prevent accidental ETH transfers
    receive() external payable {
        revert("Direct ETH not allowed");
    }

    fallback() external payable {
        revert("Unknown function");
    }
}
