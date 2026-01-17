// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {LibDiamond} from "../diamond-base/libraries/LibDiamond.sol";
import "../LibVincentDiamondStorage.sol";

/**
 * @title VincentZeroDevConfigFacet
 * @notice Facet for configuring ZeroDev-related settings
 * @dev Provides functions to set and get the ECDSA validator address used for smart account owner verification
 */
contract VincentZeroDevConfigFacet {
    /**
     * @notice Emitted when the ECDSA validator address is updated
     * @param previousAddress The previous validator address
     * @param newAddress The new validator address
     */
    event EcdsaValidatorAddressSet(address indexed previousAddress, address indexed newAddress);

    /**
     * @notice Error thrown when a zero address is provided
     */
    error ZeroAddressNotAllowed();

    /**
     * @notice Sets the ECDSA validator address used for verifying smart account owners
     * @dev Only callable by the contract owner. The validator address is used by the
     *      onlySmartAccountOwner modifier to query the EOA owner of a smart account.
     * @param _ecdsaValidatorAddress The address of the ZeroDev ECDSA validator contract
     */
    function setEcdsaValidatorAddress(address _ecdsaValidatorAddress) external {
        LibDiamond.enforceIsContractOwner();

        if (_ecdsaValidatorAddress == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentZeroDevStorage.ZeroDevStorage storage zs = VincentZeroDevStorage.zeroDevStorage();
        address previousAddress = zs.ecdsaValidatorAddress;
        zs.ecdsaValidatorAddress = _ecdsaValidatorAddress;

        emit EcdsaValidatorAddressSet(previousAddress, _ecdsaValidatorAddress);
    }

    /**
     * @notice Gets the currently configured ECDSA validator address
     * @return The address of the ZeroDev ECDSA validator contract
     */
    function getEcdsaValidatorAddress() external view returns (address) {
        VincentZeroDevStorage.ZeroDevStorage storage zs = VincentZeroDevStorage.zeroDevStorage();
        return zs.ecdsaValidatorAddress;
    }
}
