// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// A simplified interface for the OP Stack messenger contract on the L3.
interface ICrossDomainMessenger {
    // This is the magic function that tells us who the original L2 sender was.
    function xDomainMessageSender() external view returns (address);
}

/**
 * @title BridgeReceiver
 * @notice This contract lives on the L3 (Perennial).
 * It receives messages from the L2 and executes them on the PerennialVault.
 * It is the ONLY authorized caller for the vault.
 */
contract BridgeReceiver {
    // The address of the OP Stack messenger on this chain (Perennial L3).
    // This is a known, fixed address provided by the Perennial documentation.
    ICrossDomainMessenger public immutable L3_MESSENGER;

    // The address of your UserController on the L2 (Base Sepolia).
    // This is the ONLY address allowed to send commands.
    address public immutable l2UserController;

    // The address of the vault contract on this chain that holds the funds.
    address public perennialVault;

    event TradeExecuted(bytes command);

    modifier onlyL2UserController() {
        // Security Check 1: Ensure the call is coming from the official L3 messenger.
        require(
            msg.sender == address(L3_MESSENGER),
            "BridgeReceiver: Caller is not the L3 Messenger"
        );

        // Security Check 2: Ensure the original L2 sender was our UserController.
        require(
            L3_MESSENGER.xDomainMessageSender() == l2UserController,
            "BridgeReceiver: Caller is not the L2 Controller"
        );
        _;
    }

    constructor(
        address _l3MessengerAddress,
        address _l2UserControllerAddress,
        address _perennialVaultAddress
    ) {
        L3_MESSENGER = ICrossDomainMessenger(_l3MessengerAddress);
        l2UserController = _l2UserControllerAddress;
        perennialVault = _perennialVaultAddress;
    }

    /**
     * @notice Receives a close trade command from the L2 and executes it.
     */
    function executeCloseTrade(address _token, uint256 _amount)
        external
        onlyL2UserController
    {
        // Construct the call to the actual vault
        bytes memory callData = abi.encodeWithSignature(
            "closeTrade(address,uint256)",
            _token,
            _amount
        );

        // Execute the call on the vault
        (bool success, ) = perennialVault.call(callData);
        require(success, "BridgeReceiver: Vault call failed");

        emit TradeExecuted(callData);
    }

    // You would have other `execute...` functions here to match the L2 controller.
} 