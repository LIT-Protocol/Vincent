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
     * @notice Thrown when an empty tool IPFS CID is provided
     */
    error EmptyToolIpfsCid();

    /**
     * @notice Thrown when a zero address is provided
     */
    error ZeroAddressNotAllowed();

    /**
     * @notice Thrown when no registered PKPs are found for a user
     * @param userAddress The user address
     */
    error NoRegisteredPkpsFound(address userAddress);

    // Struct to hold the result of tool execution validation and policy retrieval
    struct ToolExecutionValidation {
        bool isPermitted; // Whether the delegatee is permitted to use the PKP to execute the tool
        uint256 appId; // The ID of the app associated with the delegatee
        uint256 appVersion; // The permitted app version
        PolicyWithParameters[] policies; // All policies with their parameters
    }

    // Struct to represent a tool with all its policies and parameters
    struct ToolWithPolicies {
        string toolIpfsCid; // The IPFS CID of the tool
        PolicyWithParameters[] policies; // All policies associated with this tool and their parameters
    }

    // Struct to represent a policy with its parameters
    struct PolicyWithParameters {
        string policyIpfsCid;
        bytes policyParameterValues;
    }

    /**
     * @dev Gets all PKP tokens that are registered as agents in the system with pagination support
     * @param userAddress The address of the user to query
     * @param offset The offset of the first PKP token ID to retrieve
     * @param limit The maximum number of PKP token IDs to retrieve
     * @return An array of PKP token IDs that are registered as agents
     */
    function getAllRegisteredAgentPkps(address userAddress, uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        if (userAddress == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        uint256[] memory allPkps = us_.userAddressToRegisteredAgentPkps[userAddress].values();
        uint256 length = allPkps.length;

        if (length == 0) {
            revert NoRegisteredPkpsFound(userAddress);
        }

        if (offset >= length) {
            revert InvalidOffset(offset, length);
        }

        uint256 end = offset + limit;
        if (end > length) {
            end = length;
        }

        uint256 resultCount = end - offset;
        uint256[] memory pkps = new uint256[](resultCount);

        for (uint256 i = offset; i < end; i++) {
            pkps[i - offset] = allPkps[i];
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
     * @dev Gets all app IDs that have permissions for a specific PKP token, excluding deleted apps, with pagination support
     * @param pkpTokenId The PKP token ID
     * @param offset The offset of the first app ID to retrieve
     * @param limit The maximum number of app IDs to retrieve
     * @return An array of app IDs that have permissions for the PKP token and haven't been deleted
     */
    function getAllPermittedAppIdsForPkp(uint256 pkpTokenId, uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        uint256[] memory allPermittedAppIds = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.values();

        uint256[] memory nonDeletedAppIds = new uint256[](allPermittedAppIds.length);
        uint256 nonDeletedCount = 0;

        for (uint256 i = 0; i < allPermittedAppIds.length; i++) {
            if (!as_.appIdToApp[allPermittedAppIds[i]].isDeleted) {
                nonDeletedAppIds[nonDeletedCount] = allPermittedAppIds[i];
                nonDeletedCount++;
            }
        }

        if (nonDeletedCount == 0) {
            return new uint256[](0);
        }

        if (offset >= nonDeletedCount) {
            revert InvalidOffset(offset, nonDeletedCount);
        }

        uint256 end = offset + limit;
        if (end > nonDeletedCount) {
            end = nonDeletedCount;
        }

        uint256 resultCount = end - offset;
        uint256[] memory result = new uint256[](resultCount);

        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = nonDeletedAppIds[i];
        }

        return result;
    }

    /**
     * @dev Gets all permitted tools, policies, and policy parameters for a specific app and PKP
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return tools An array of tools with their policies and parameters
     */
    function getAllToolsAndPoliciesForApp(uint256 pkpTokenId, uint256 appId)
        external
        view
        returns (ToolWithPolicies[] memory tools)
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
            return new ToolWithPolicies[](0);
        }

        // Get the app version
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        // Get all tool hashes for this app version
        bytes32[] memory toolHashes = versionedApp.toolIpfsCidHashes.values();
        uint256 toolCount = toolHashes.length;

        // Create the result array
        tools = new ToolWithPolicies[](toolCount);

        // For each tool, get its policies and parameters
        for (uint256 i = 0; i < toolCount; i++) {
            bytes32 toolHash = toolHashes[i];
            tools[i] = _getToolWithPolicies(toolHash, pkpTokenId, appId, appVersion, versionedApp, us_, ls_);
        }

        return tools;
    }

    /**
     * @dev Validates if a delegatee is permitted to execute a tool with a PKP and returns all relevant policies
     * @param delegatee The address of the delegatee
     * @param pkpTokenId The PKP token ID
     * @param toolIpfsCid The IPFS CID of the tool
     * @return validation A struct containing validation result and policy information
     */
    function validateToolExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string calldata toolIpfsCid)
        external
        view
        returns (ToolExecutionValidation memory validation)
    {
        // Check for invalid inputs
        if (delegatee == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (bytes(toolIpfsCid).length == 0) {
            revert EmptyToolIpfsCid();
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

        // Hash the tool IPFS CID once to avoid repeated hashing
        bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Get the permitted app version for this PKP and app
        uint256 appVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0), return early with isPermitted = false
        if (appVersion == 0) {
            return validation;
        }

        validation.appVersion = appVersion;

        // Check if the app version is enabled and the tool is registered for this app version
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        if (!versionedApp.enabled || !versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
            return validation;
        }

        // If we've reached here, the tool is permitted
        validation.isPermitted = true;

        // Get all policies registered for this tool in the app version
        EnumerableSet.Bytes32Set storage toolPolicyIpfsCidHashes =
            versionedApp.toolIpfsCidHashToToolPolicyIpfsCidHashes[hashedToolIpfsCid];

        // Get all policy hashes for this tool from the app version
        bytes32[] memory allPolicyHashes = toolPolicyIpfsCidHashes.values();
        uint256 policyCount = allPolicyHashes.length;

        // Create the policies array
        validation.policies = new PolicyWithParameters[](policyCount);

        // Get the tool policy storage for this PKP, app, app version, and tool
        mapping(bytes32 => bytes) storage toolPolicyParameterValues =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyParameterValues[appId][appVersion][hashedToolIpfsCid];

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = allPolicyHashes[i];

            // Get the policy IPFS CID
            validation.policies[i].policyIpfsCid = ls_.ipfsCidHashToIpfsCid[policyHash];
            validation.policies[i].policyParameterValues = toolPolicyParameterValues[policyHash];
        }

        return validation;
    }

    /**
     * @dev Internal function to get a tool with its policies and parameters
     * @param toolHash The hash of the tool IPFS CID
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param appVersion The app version
     * @param versionedApp The versioned app storage
     * @param us_ The user storage
     * @param ls_ The lit action storage
     * @return toolWithPolicies The tool with its policies and parameters
     */
    function _getToolWithPolicies(
        bytes32 toolHash,
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        VincentAppStorage.AppVersion storage versionedApp,
        VincentUserStorage.UserStorage storage us_,
        VincentLitActionStorage.LitActionStorage storage ls_
    ) internal view returns (ToolWithPolicies memory toolWithPolicies) {
        // Get the tool IPFS CID
        toolWithPolicies.toolIpfsCid = ls_.ipfsCidHashToIpfsCid[toolHash];

        // Get all policies registered for this tool in the app version
        EnumerableSet.Bytes32Set storage toolPolicyIpfsCidHashes =
            versionedApp.toolIpfsCidHashToToolPolicyIpfsCidHashes[toolHash];

        // Get all policy hashes for this tool from the app version
        bytes32[] memory allPolicyHashes = toolPolicyIpfsCidHashes.values();
        uint256 policyCount = allPolicyHashes.length;

        // Create the policies array for this tool
        toolWithPolicies.policies = new PolicyWithParameters[](policyCount);

        // Get the tool policy storage for this PKP, app, and tool
        mapping(bytes32 => bytes) storage toolPolicyParameterValues =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyParameterValues[appId][appVersion][toolHash];

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = allPolicyHashes[i];
            toolWithPolicies.policies[i].policyIpfsCid = ls_.ipfsCidHashToIpfsCid[policyHash];
            toolWithPolicies.policies[i].policyParameterValues = toolPolicyParameterValues[policyHash];
        }
    }
}