// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

interface IRiskLock {
  function updateLockFromFunctions(address user, bool locked) external;
  function isLocked(address user) external view returns (bool);
}

interface IRiskCooldownProxy {
  function triggerCooldown(address user) external;
}

interface IGuardian {
  function isGuardian(address user) external view returns (bool);
}

contract RiskFunctionsConsumer is FunctionsClient, ConfirmedOwner {
  using FunctionsRequest for FunctionsRequest.Request;

  bytes32 public donId;
  address public immutable elizaAgent;

  IRiskLock public immutable riskLock;
  IRiskCooldownProxy public immutable cooldownProxy;
  IGuardian public immutable guardian;

  event BatchLockStatusProcessed(address[] users, bool[] statuses);
  event MonitorRequested(address indexed user);

  constructor(
    address router,
    bytes32 _donId,
    address _riskLock,
    address _cooldownProxy,
    address _guardian,
    address _elizaAgent
  ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
    donId = _donId;
    riskLock = IRiskLock(_riskLock);
    cooldownProxy = IRiskCooldownProxy(_cooldownProxy);
    guardian = IGuardian(_guardian);
    elizaAgent = _elizaAgent;
  }

  /**
   * @notice Called by ElizaOS to request monitoring of a user
   */
  function requestMonitor(address user) external {
    require(msg.sender == elizaAgent, "Only ElizaOS can trigger monitoring");
    emit MonitorRequested(user);
  }

  /**
   * @notice Sends a Chainlink Functions request
   */
  function sendRiskCheckRequest(
    string calldata source,
    FunctionsRequest.Location secretsLocation,
    bytes calldata encryptedSecretsReference,
    string[] calldata args,
    bytes[] calldata bytesArgs,
    uint64 subscriptionId,
    uint32 callbackGasLimit
  ) external {
    FunctionsRequest.Request memory req;
    req.initializeRequest(
      FunctionsRequest.Location.Inline,
      FunctionsRequest.CodeLanguage.JavaScript,
      source
    );
    req.secretsLocation = secretsLocation;
    req.encryptedSecretsReference = encryptedSecretsReference;

    if (args.length > 0) req.setArgs(args);
    if (bytesArgs.length > 0) req.setBytesArgs(bytesArgs);

    _sendRequest(req.encodeCBOR(), subscriptionId, callbackGasLimit, donId);
  }

  /**
   * @notice Fulfillment logic called by Chainlink Functions
   *         Expects response to be (address[] users, bool[] statuses)
   */
  function fulfillRequest(
    bytes32, /* requestId */
    bytes memory response,
    bytes memory err
  ) internal override {
    if (err.length > 0) {
      // Handle error case if needed in the future
      return;
    }

    (address[] memory users, bool[] memory statuses) = abi.decode(response, (address[], bool[]));
    require(users.length == statuses.length, "Mismatched batch lengths");

    for (uint256 i = 0; i < users.length; i++) {
      if (statuses[i] && users[i] != address(0)) {
        riskLock.updateLockFromFunctions(users[i], true);
        cooldownProxy.triggerCooldown(users[i]);
      }
    }

    emit BatchLockStatusProcessed(users, statuses);
  }

  function setDonId(bytes32 newDonId) external onlyOwner {
    donId = newDonId;
  }
}
