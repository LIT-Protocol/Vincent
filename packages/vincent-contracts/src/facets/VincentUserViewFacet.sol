// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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

    error PkpNotPermittedForAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion);
    error PolicyParameterNotSetForPkp(
        uint256 pkpTokenId, uint256 appId, uint256 appVersion, string policyIpfsCid, string parameterName
    );
    error DelegateeNotAssociatedWithApp(address delegatee);

    // Struct to hold a parameter name and its value
    struct PolicyParameter {
        string name;
        string value;
    }

    // Struct to represent a policy with its parameters
    struct PolicyWithParameters {
        string policyIpfsCid;
        PolicyParameter[] parameters;
    }

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

    /**
     * @dev Gets all PKP tokens that are registered as agents in the system
     * @return An array of PKP token IDs that are registered as agents
     */
    function getAllRegisteredAgentPkps(address userAddress) external view returns (uint256[] memory) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        return us_.userAddressToRegisteredAgentPkps[userAddress].values();
    }

    /**
     * @dev Gets all permitted app versions for a specific app and PKP token
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return An array of app versions that are permitted for the PKP token
     */
    function getPermittedAppVersionForPkp(uint256 pkpTokenId, uint256 appId) external view returns (uint256) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        return us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];
    }

    /**
     * @dev Gets all app IDs that have permissions for a specific PKP token
     * @param pkpTokenId The PKP token ID
     * @return An array of app IDs that have permissions for the PKP token
     */
    function getAllPermittedAppIdsForPkp(uint256 pkpTokenId) external view returns (uint256[] memory) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        return us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.values();
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
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        // Get the permitted app version for this PKP and app
        uint256 appVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0), return an empty array
        if (appVersion == 0) {
            return new ToolWithPolicies[](0);
        }

        // Get the app version
        VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];

        // If the app version is not enabled, return an empty array
        if (!versionedApp.enabled) {
            return new ToolWithPolicies[](0);
        }

        // Get all tool hashes for this app version
        bytes32[] memory toolHashes = versionedApp.toolIpfsCidHashes.values();
        uint256 toolCount = toolHashes.length;

        // Create the result array
        tools = new ToolWithPolicies[](toolCount);

        // For each tool, get its policies and parameters
        for (uint256 i = 0; i < toolCount; i++) {
            bytes32 toolHash = toolHashes[i];

            // Get the tool IPFS CID
            tools[i].toolIpfsCid = ts_.toolIpfsCidHashToIpfsCid[toolHash];

            // Get the tool policy storage for this PKP, app, and tool
            VincentUserStorage.ToolPolicyStorage storage toolPolicyStorage =
                us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[appId][toolHash];

            // Get all policies that have parameters set for this tool
            bytes32[] memory policyHashes = toolPolicyStorage.policyIpfsCidHashesWithParameters.values();
            uint256 policyCount = policyHashes.length;

            // Create the policies array for this tool
            tools[i].policies = new PolicyWithParameters[](policyCount);

            // For each policy, get all its parameters
            for (uint256 j = 0; j < policyCount; j++) {
                bytes32 policyHash = policyHashes[j];

                // Get the policy IPFS CID
                tools[i].policies[j].policyIpfsCid = ts_.policyIpfsCidHashToIpfsCid[policyHash];

                // Get the policy parameters storage
                VincentUserStorage.PolicyParametersStorage storage policyParametersStorage =
                    toolPolicyStorage.policyIpfsCidHashToPolicyParametersStorage[policyHash];

                // Get parameter names hashes
                bytes32[] memory paramNameHashes = policyParametersStorage.policyParameterNameHashes.values();
                uint256 paramCount = paramNameHashes.length;

                // Create the parameters array for this policy
                tools[i].policies[j].parameters = new PolicyParameter[](paramCount);

                // For each parameter, get its name and value
                for (uint256 k = 0; k < paramCount; k++) {
                    bytes32 paramHash = paramNameHashes[k];

                    // Get parameter name and value
                    tools[i].policies[j].parameters[k].name = ts_.policyParameterNameHashToName[paramHash];
                    tools[i].policies[j].parameters[k].value =
                        policyParametersStorage.policyParameterNameHashToValue[paramHash];
                }
            }
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
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        // Initialize the validation result
        validation.isPermitted = false;

        // Get the app ID that the delegatee belongs to
        uint256 appId = as_.delegateeAddressToAppId[delegatee];
        validation.appId = appId;

        // If appId is 0, delegatee is not associated with any app
        if (appId == 0) {
            revert DelegateeNotAssociatedWithApp(delegatee);
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
        VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];

        if (!versionedApp.enabled || !versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
            return validation;
        }

        // If we've reached here, the tool is permitted
        validation.isPermitted = true;

        // Get the tool policy storage for this PKP, app, and tool
        VincentUserStorage.ToolPolicyStorage storage toolPolicyStorage =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[appId][hashedToolIpfsCid];

        // Get all policies that have parameters set for this tool
        bytes32[] memory policyHashes = toolPolicyStorage.policyIpfsCidHashesWithParameters.values();
        uint256 policyCount = policyHashes.length;

        // Create the policies array
        validation.policies = new PolicyWithParameters[](policyCount);

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = policyHashes[i];

            // Get the policy IPFS CID
            validation.policies[i].policyIpfsCid = ts_.policyIpfsCidHashToIpfsCid[policyHash];

            // Get the policy parameters storage
            VincentUserStorage.PolicyParametersStorage storage policyParametersStorage =
                toolPolicyStorage.policyIpfsCidHashToPolicyParametersStorage[policyHash];

            // Get parameter names hashes
            bytes32[] memory paramNameHashes = policyParametersStorage.policyParameterNameHashes.values();
            uint256 paramCount = paramNameHashes.length;

            // Create the parameters array for this policy
            validation.policies[i].parameters = new PolicyParameter[](paramCount);

            // For each parameter, get its name and value
            for (uint256 j = 0; j < paramCount; j++) {
                bytes32 paramHash = paramNameHashes[j];

                // Get parameter name and value
                validation.policies[i].parameters[j].name = ts_.policyParameterNameHashToName[paramHash];
                validation.policies[i].parameters[j].value =
                    policyParametersStorage.policyParameterNameHashToValue[paramHash];
            }
        }

        return validation;
    }
}
