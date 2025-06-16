pragma solidity ^0.8.19;

import { FunctionsClient } from "node_modules/@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";



interface IRiskLock {
    function updateLockFromFunctions(bool locked) external;
}

contract RiskFunctionsConsumer is FunctionsClient {

    address public owner;
    address public riskLock;

    event ResponseReceived(bytes32 indexed requestId, bytes result, bytes err);


    constructor(address router, address _riskLock) FunctionsClient(router) {
        owner = msg.sender;
        riskLock = _riskLock;
    }

    function fulfillRequest(
    bytes32 requestId,
    bytes memory response,
    bytes memory err
    ) internal override {
    emit ResponseReceived(requestId, response, err);

    if (err.length == 0) {
        bool locked = abi.decode(response, (bool));
        IRiskLock(riskLock).updateLockFromFunctions(locked);
    }
    }
}
