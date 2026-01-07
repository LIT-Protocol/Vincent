// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibVincentDiamondStorage.sol";

/**
 * @title LibERC2771
 * @notice Library for EIP-2771 meta-transaction support
 * @dev Provides helper functions to extract the real sender from meta-transactions
 *      relayed through a trusted forwarder (e.g., Gelato Relay)
 */
library LibERC2771 {
    /**
     * @notice Emitted when the trusted forwarder is set or updated
     * @param newTrustedForwarder The address of the new trusted forwarder
     */
    event TrustedForwarderSet(address indexed newTrustedForwarder);

    /**
     * @notice Returns the actual sender of the transaction
     * @dev If the transaction comes from the trusted forwarder, extracts the real sender
     *      from the last 20 bytes of calldata. Otherwise returns msg.sender.
     * @return sender The actual sender address
     */
    function _msgSender() internal view returns (address sender) {
        VincentERC2771Storage.ERC2771Storage storage es = VincentERC2771Storage.erc2771Storage();
        if (msg.sender == es.trustedForwarder && msg.data.length >= 20) {
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            sender = msg.sender;
        }
    }

    /**
     * @notice Returns the actual calldata
     * @dev If the transaction comes from the trusted forwarder, strips the last 20 bytes
     *      (the appended sender address). Otherwise returns msg.data as-is.
     * @return The actual calldata
     */
    function _msgData() internal view returns (bytes memory) {
        VincentERC2771Storage.ERC2771Storage storage es = VincentERC2771Storage.erc2771Storage();
        if (msg.sender == es.trustedForwarder && msg.data.length >= 20) {
            return msg.data[0:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }
}
