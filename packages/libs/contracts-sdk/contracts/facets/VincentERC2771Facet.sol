// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../diamond-base/libraries/LibDiamond.sol";
import "../LibVincentDiamondStorage.sol";
import "../libs/LibERC2771.sol";

/**
 * @title VincentERC2771Facet
 * @notice Manages EIP-2771 meta-transaction support for gasless transactions
 * @dev Allows setting a trusted forwarder (e.g., Gelato Relay) that can relay transactions
 *      on behalf of users, enabling gasless interactions with Vincent contracts.
 */
contract VincentERC2771Facet {
    /**
     * @notice Sets the trusted forwarder address for EIP-2771 meta-transactions
     * @dev Only the contract owner can set the trusted forwarder.
     *      Setting to address(0) disables EIP-2771 support.
     * @param forwarder Address of the trusted forwarder (e.g., Gelato Relay address), or address(0) to disable
     */
    function setTrustedForwarder(address forwarder) external {
        LibDiamond.enforceIsContractOwner();

        VincentERC2771Storage.erc2771Storage().trustedForwarder = forwarder;
        emit LibERC2771.TrustedForwarderSet(forwarder);
    }

    /**
     * @notice Returns the current trusted forwarder address
     * @return The address of the trusted forwarder
     */
    function getTrustedForwarder() external view returns (address) {
        return VincentERC2771Storage.erc2771Storage().trustedForwarder;
    }

    /**
     * @notice Checks if an address is the trusted forwarder
     * @param forwarder Address to check
     * @return True if the address is the trusted forwarder
     */
    function isTrustedForwarder(address forwarder) external view returns (bool) {
        return VincentERC2771Storage.erc2771Storage().trustedForwarder == forwarder;
    }
}
