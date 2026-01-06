// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../diamond-base/libraries/LibDiamond.sol";
import "../LibVincentDiamondStorage.sol";

/**
 * @title VincentERC2771Facet
 * @notice Manages EIP-2771 meta-transaction support for gasless transactions
 * @dev Allows setting a trusted forwarder (e.g., Gelato Relay) that can relay transactions
 *      on behalf of users, enabling gasless interactions with Vincent contracts.
 */
contract VincentERC2771Facet {
    error CallerNotOwner();
    error ZeroAddressNotAllowed();

    event TrustedForwarderSet(address indexed newTrustedForwarder);

    /**
     * @notice Sets the trusted forwarder address for EIP-2771 meta-transactions
     * @dev Only the contract owner can set the trusted forwarder
     * @param forwarder Address of the trusted forwarder (e.g., Gelato Relay address)
     */
    function setTrustedForwarder(address forwarder) external {
        LibDiamond.enforceIsContractOwner();

        if (forwarder == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentERC2771Storage.erc2771Storage().trustedForwarder = forwarder;
        emit TrustedForwarderSet(forwarder);
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
