// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

/**
 * @title VincentUserViewFacet
 * @dev View functions for user-related data stored in the VincentUserStorage
 */
contract VincentUserViewFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Thrown when a PKP is not permitted for a specific app version
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param appVersion The app version
     */
    error PkpNotPermittedForAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion);

    /**
     * @notice Thrown when a policy parameter is not set for a PKP
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param appVersion The app version
     * @param policyIpfsCid The policy IPFS CID
     * @param parameterName The parameter name
     */
    error PolicyParameterNotSetForPkp(
        uint256 pkpTokenId, uint256 appId, uint256 appVersion, string policyIpfsCid, string parameterName
    );

    /**
     * @notice Thrown when a delegatee is not associated with any app
     * @param delegatee The delegatee address
     */
    error DelegateeNotAssociatedWithApp(address delegatee);

    /**
     * @notice Thrown when an invalid PKP token ID is provided
     */
    error InvalidPkpTokenId();

    /**
     * @notice Thrown when an invalid app ID is provided
     */
    error InvalidAppId();

    /**
     * @notice Thrown when an empty ability IPFS CID is provided
     */
    error EmptyAbilityIpfsCid();

    /**
     * @notice Thrown when a zero address is provided
     */
    error ZeroAddressNotAllowed();

    /**
     * @notice Thrown when no registered PKPs are found for a user
     * @param userAddress The user address
     */
    error NoRegisteredPkpsFound(address userAddress);

    // Struct to hold the result of ability execution validation and policy retrieval
    struct AbilityExecutionValidation {
        bool isPermitted; // Whether the delegatee is permitted to use the PKP to execute the ability
        uint256 appId; // The ID of the app associated with the delegatee
        uint256 appVersion; // The permitted app version
        PolicyWithParameters[] policies; // All policies with their parameters
    }

    // Struct to represent an ability with all its policies and parameters
    struct AbilityWithPolicies {
        string abilityIpfsCid; // The IPFS CID of the ability
        PolicyWithParameters[] policies; // All policies associated with this ability and their parameters
    }

    // Struct to represent a policy with its parameters
    struct PolicyWithParameters {
        string policyIpfsCid;
        bytes policyParameterValues;
    }

    /**
     * @dev Gets all PKP tokens that are registered as agents in the system
     * @return An array of PKP token IDs that are registered as agents
     */
    function getAllRegisteredAgentPkps(address userAddress) external view returns (uint256[] memory) {
        // Check for zero address
        if (userAddress == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        uint256[] memory pkps = us_.userAddressToRegisteredAgentPkps[userAddress].values();

        // Check if there are any registered PKPs
        if (pkps.length == 0) {
            revert NoRegisteredPkpsFound(userAddress);
        }

        return pkps;
    }

    /**
     * @dev Gets all permitted app versions for a specific app and PKP token
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return An array of app versions that are permitted for the PKP token
     */
    function getPermittedAppVersionForPkp(uint256 pkpTokenId, uint256 appId)
        external
        view
        appNotDeleted(appId)
        returns (uint256)
    {
        // Check for invalid PKP token ID and app ID
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (appId == 0) {
            revert InvalidAppId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        return us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];
    }

    /**
     * @dev Gets all app IDs that have permissions for a specific PKP token, excluding deleted apps
     * @param pkpTokenId The PKP token ID
     * @return An array of app IDs that have permissions for the PKP token and haven't been deleted
     */
    function getAllPermittedAppIdsForPkp(uint256 pkpTokenId) external view returns (uint256[] memory) {
        // Check for invalid PKP token ID
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Get all permitted app IDs
        uint256[] memory allPermittedAppIds = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.values();

        // Create dynamic array for active apps
        uint256[] memory nonDeletedAppIds = new uint256[](allPermittedAppIds.length);
        uint256 nonDeletedCount = 0;

        // Single loop to collect non-deleted apps
        for (uint256 i = 0; i < allPermittedAppIds.length; i++) {
            if (!as_.appIdToApp[allPermittedAppIds[i]].isDeleted) {
                nonDeletedAppIds[nonDeletedCount] = allPermittedAppIds[i];
                nonDeletedCount++;
            }
        }

        // Resize array to actual size
        assembly {
            mstore(nonDeletedAppIds, nonDeletedCount)
        }

        return nonDeletedAppIds;
    }

    /**
     * @dev Gets all permitted abilities, policies, and policy parameters for a specific app and PKP
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return abilities An array of abilities with their policies and parameters
     */
    function getAllAbilitiesAndPoliciesForApp(uint256 pkpTokenId, uint256 appId)
        external
        view
        returns (AbilityWithPolicies[] memory abilities)
    {
        // Check for invalid PKP token ID and app ID
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (appId == 0) {
            revert InvalidAppId();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        if (as_.appIdToApp[appId].isDeleted) {
            revert AppHasBeenDeleted(appId);
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        // Get the permitted app version for this PKP and app
        uint256 appVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0), return an empty array
        if (appVersion == 0) {
            return new AbilityWithPolicies[](0);
        }

        // Get the app version
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        // Get all ability hashes for this app version
        bytes32[] memory abilityHashes = versionedApp.abilityIpfsCidHashes.values();
        uint256 abilityCount = abilityHashes.length;

        // Create the result array
        abilities = new AbilityWithPolicies[](abilityCount);

        // For each ability, get its policies and parameters
        for (uint256 i = 0; i < abilityCount; i++) {
            bytes32 abilityHash = abilityHashes[i];
            abilities[i] = _getAbilityWithPolicies(abilityHash, pkpTokenId, appId, appVersion, versionedApp, us_, ls_);
        }

        return abilities;
    }

    /**
     * @dev Validates if a delegatee is permitted to execute an ability with a PKP and returns all relevant policies
     * @param delegatee The address of the delegatee
     * @param pkpTokenId The PKP token ID
     * @param abilityIpfsCid The IPFS CID of the ability
     * @return validation A struct containing validation result and policy information
     */
    function validateAbilityExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string calldata abilityIpfsCid)
        external
        view
        returns (AbilityExecutionValidation memory validation)
    {
        // Check for invalid inputs
        if (delegatee == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (bytes(abilityIpfsCid).length == 0) {
            revert EmptyAbilityIpfsCid();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        // Initialize the validation result
        validation.isPermitted = false;

        // Get the app ID that the delegatee belongs to
        uint256 appId = as_.delegateeAddressToAppId[delegatee];
        validation.appId = appId;

        // If appId is 0, delegatee is not associated with any app
        if (appId == 0) {
            revert DelegateeNotAssociatedWithApp(delegatee);
        }

        if (as_.appIdToApp[appId].isDeleted) {
            revert AppHasBeenDeleted(appId);
        }

        // Hash the ability IPFS CID once to avoid repeated hashing
        bytes32 hashedAbilityIpfsCid = keccak256(abi.encodePacked(abilityIpfsCid));

        // Get the permitted app version for this PKP and app
        uint256 appVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0), return early with isPermitted = false
        if (appVersion == 0) {
            return validation;
        }

        validation.appVersion = appVersion;

        // Check if the app version is enabled and the ability is registered for this app version
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        if (!versionedApp.enabled || !versionedApp.abilityIpfsCidHashes.contains(hashedAbilityIpfsCid)) {
            return validation;
        }

        // If we've reached here, the ability is permitted
        validation.isPermitted = true;

        // Get all policies registered for this ability in the app version
        EnumerableSet.Bytes32Set storage abilityPolicyIpfsCidHashes =
            versionedApp.abilityIpfsCidHashToAbilityPolicyIpfsCidHashes[hashedAbilityIpfsCid];

        // Get all policy hashes for this ability from the app version
        bytes32[] memory allPolicyHashes = abilityPolicyIpfsCidHashes.values();
        uint256 policyCount = allPolicyHashes.length;

        // Create the policies array
        validation.policies = new PolicyWithParameters[](policyCount);

        // Get the ability policy storage for this PKP, app, app version, and ability
        mapping(bytes32 => bytes) storage abilityPolicyParameterValues =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].abilityPolicyParameterValues[appId][appVersion][hashedAbilityIpfsCid];

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = allPolicyHashes[i];

            // Get the policy IPFS CID
            validation.policies[i].policyIpfsCid = ls_.ipfsCidHashToIpfsCid[policyHash];
            validation.policies[i].policyParameterValues = abilityPolicyParameterValues[policyHash];
        }

        return validation;
    }

    /**
     * @dev Internal function to get an ability with its policies and parameters
     * @param abilityHash The hash of the ability IPFS CID
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param appVersion The app version
     * @param versionedApp The versioned app storage
     * @param us_ The user storage
     * @param ls_ The lit action storage
     * @return abilityWithPolicies The ability with its policies and parameters
     */
    function _getAbilityWithPolicies(
        bytes32 abilityHash,
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        VincentAppStorage.AppVersion storage versionedApp,
        VincentUserStorage.UserStorage storage us_,
        VincentLitActionStorage.LitActionStorage storage ls_
    ) internal view returns (AbilityWithPolicies memory abilityWithPolicies) {
        // Get the ability IPFS CID
        abilityWithPolicies.abilityIpfsCid = ls_.ipfsCidHashToIpfsCid[abilityHash];

        // Get all policies registered for this ability in the app version
        EnumerableSet.Bytes32Set storage abilityPolicyIpfsCidHashes =
            versionedApp.abilityIpfsCidHashToAbilityPolicyIpfsCidHashes[abilityHash];

        // Get all policy hashes for this ability from the app version
        bytes32[] memory allPolicyHashes = abilityPolicyIpfsCidHashes.values();
        uint256 policyCount = allPolicyHashes.length;

        // Create the policies array for this ability
        abilityWithPolicies.policies = new PolicyWithParameters[](policyCount);

        // Get the ability policy storage for this PKP, app, and ability
        mapping(bytes32 => bytes) storage abilityPolicyParameterValues =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].abilityPolicyParameterValues[appId][appVersion][abilityHash];

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = allPolicyHashes[i];
            abilityWithPolicies.policies[i].policyIpfsCid = ls_.ipfsCidHashToIpfsCid[policyHash];
            abilityWithPolicies.policies[i].policyParameterValues = abilityPolicyParameterValues[policyHash];
        }
    }
}
