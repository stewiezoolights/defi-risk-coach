// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// A simplified interface for the OP Stack messenger contract.
interface ICrossDomainMessenger {
    function sendMessage(
        address _target,
        bytes calldata _message,
        uint32 _minGasLimit
    ) external;
}

/**
 * @title UserController
 * @notice This contract lives on the L2 (Base Sepolia).
 * It is the main entry point for the user to control their funds on the L3.
 * It sends messages to the L3 via the OP Stack CrossDomainMessenger.
 */
contract UserController {
    // The address of the OP Stack messenger on this chain (Base Sepolia L2).
    // This is a known, fixed address provided by the Base documentation.
    ICrossDomainMessenger public immutable L2_MESSENGER;

    // The address of your BridgeReceiver contract on the L3 (Perennial).
    address public l3BridgeReceiver;

    // This would be your Chainlink Functions router, etc.
    // address public functionsRouter;
    // bytes32 public donId;

    event TradeRequested(address indexed user, address token, uint256 amount);

    constructor(address _l2MessengerAddress, address _l3BridgeReceiverAddress) {
        L2_MESSENGER = ICrossDomainMessenger(_l2MessengerAddress);
        l3BridgeReceiver = _l3BridgeReceiverAddress;
    }

    /**
     * @notice Closes a trade by sending a message to the L3 vault.
     * @dev This is a simplified example. In a real scenario, you might add
     *      Chainlink Functions calls here for pre-flight checks.
     */
    function requestCloseTrade(address _token, uint256 _amount) external {
        // Step 1: Encode the function call for the L3 receiver.
        // We are telling the receiver to call its `executeTrade` function.
        bytes memory message = abi.encodeWithSelector(
            bytes4(keccak256("executeCloseTrade(address,uint256)")),
            _token,
            _amount
        );

        // Step 2: Send the encoded message via the L2 messenger.
        // The L3 will receive this and execute it. We must provide enough gas.
        L2_MESSENGER.sendMessage(l3BridgeReceiver, message, 500000); // 500k gas limit, adjust as needed

        emit TradeRequested(msg.sender, _token, _amount);
    }

    // You would have other functions here like:
    // - fulfillRequest(...) for Chainlink Functions callbacks
    // - requestOpenTrade(...)
    // - requestWithdrawal(...)
} 