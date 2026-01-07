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
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public constant AGENT_PAGE_SIZE = 50;

    /**
     * @notice Thrown when an agent is not permitted for a specific app version
     * @param agentAddress The agent address
     * @param appId The app ID
     * @param appVersion The app version
     */
    error AgentNotPermittedForAppVersion(address agentAddress, uint40 appId, uint24 appVersion);

    /**
     * @notice Thrown when a policy parameter is not set for an agent
     * @param agentAddress The agent address
     * @param appId The app ID
     * @param appVersion The app version
     * @param policyIpfsCid The policy IPFS CID
     * @param parameterName The parameter name
     */
    error PolicyParameterNotSetForAgent(
        address agentAddress, uint40 appId, uint24 appVersion, string policyIpfsCid, string parameterName
    );

    /**
     * @notice Thrown when a delegatee is not associated with any app
     * @param delegatee The delegatee address
     */
    error DelegateeNotAssociatedWithApp(address delegatee);

    /**
     * @notice Thrown when an invalid app ID is provided
     */
    error InvalidAppId();

    /**
     * @notice Thrown when an empty ability IPFS CID is provided
     */
    error EmptyAbilityIpfsCid();

    /**
     * @notice Thrown when no registered agents are found for a user
     * @param userAddress The user address
     */
    error NoRegisteredAgentsFound(address userAddress);

    /**
     * @notice Thrown when an agent is not registered
     * @param agentAddress The agent address
     */
    error AgentNotRegistered(address agentAddress);

    // Struct to hold the result of ability execution validation and policy retrieval
    struct AbilityExecutionValidation {
        bool isPermitted; // Whether the delegatee is permitted to use the agent to execute the ability
        uint40 appId; // The ID of the app associated with the delegatee
        uint24 appVersion; // The permitted app version
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
     * @notice Represents permitted app information for an agent
     * @dev Contains app ID, permitted version, and whether that version is enabled
     * @param appId The ID of the permitted app
     * @param version The permitted version of the app
     * @param versionEnabled Whether the permitted version is currently enabled
     * @param isDeleted Whether the app has been deleted
     */
    struct PermittedApp {
        uint40 appId;
        uint24 version;
        address pkpSigner;
        uint256 pkpSignerPubKey;
        bool versionEnabled;
        bool isDeleted;
    }

    /**
     * @notice Represents unpermitted app information for an agent
     * @dev Contains app ID, last permitted version, and whether that version is enabled
     * @param appId The ID of the unpermitted app
     * @param previousPermittedVersion The last permitted version before unpermitting
     * @param versionEnabled Whether the previous permitted version is currently enabled
     * @param isDeleted Whether the app has been deleted
     */
    struct UnpermittedApp {
        uint40 appId;
        uint24 previousPermittedVersion;
        address pkpSigner;
        uint256 pkpSignerPubKey;
        bool versionEnabled;
        bool isDeleted;
    }

    /**
     * @notice Represents an agent's permitted app information
     * @dev Contains the agent address and its permitted app (if any)
     * @param agentAddress The address of the agent
     * @param permittedApp The permitted app information (appId will be 0 if no app is permitted)
     */
    struct AgentPermittedApp {
        address agentAddress;
        PermittedApp permittedApp;
    }

    /**
     * @notice Represents an agent's unpermitted app information
     * @dev Contains the agent address and its last permitted app (if it was unpermitted)
     * @param agentAddress The address of the agent
     * @param unpermittedApp The unpermitted app information (appId will be 0 if agent never had an app)
     */
    struct AgentUnpermittedApp {
        address agentAddress;
        UnpermittedApp unpermittedApp;
    }

    /**
     * @dev Gets all agents for a user address that are registered in the system with pagination support
     * @param userAddress The address of the user to query
     * @param offset The offset of the first agent address to retrieve
     * @return An array of agent addresses that are registered as agents
     */
    function getAllRegisteredAgentAddressesForUser(address userAddress, uint256 offset)
        external
        view
        returns (address[] memory)
    {
        if (userAddress == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        EnumerableSet.AddressSet storage agentSet = us_.userAddressToRegisteredAgentAddresses[userAddress];
        uint256 length = agentSet.length();

        if (length == 0) {
            revert NoRegisteredAgentsFound(userAddress);
        }

        if (offset >= length) {
            revert InvalidOffset(offset, length);
        }

        uint256 end = offset + AGENT_PAGE_SIZE;
        if (end > length) {
            end = length;
        }

        uint256 resultCount = end - offset;
        address[] memory agentAddresses = new address[](resultCount);

        for (uint256 i = offset; i < end; i++) {
            agentAddresses[i - offset] = agentSet.at(i);
        }

        return agentAddresses;
    }

    /**
     * @notice Gets the user address associated with an agent address
     * @dev Returns the user address that registered the agent
     * @param agentAddress The agent address to query
     * @return userAddress The user address that registered this agent
     */
    function getUserAddressForAgent(address agentAddress) external view returns (address userAddress) {
        // Check for invalid agent address
        if (agentAddress == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        userAddress = us_.registeredAgentAddressToUserAddress[agentAddress];

        // Revert if agent is not registered
        if (userAddress == address(0)) {
            revert AgentNotRegistered(agentAddress);
        }
    }

    /**
     * @notice Retrieves the permitted app for multiple agents
     * @dev Takes an array of agent addresses and returns the currently permitted app (max 1 per agent)
     * @param agentAddresses Array of agent addresses to query
     * @return results Array of AgentPermittedApp structs containing agent address and permitted app info
     */
    function getPermittedAppForAgents(address[] memory agentAddresses)
        external
        view
        returns (AgentPermittedApp[] memory results)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        results = new AgentPermittedApp[](agentAddresses.length);

        for (uint256 i; i < agentAddresses.length; i++) {
            address agentAddress = agentAddresses[i];

            if (agentAddress == address(0)) {
                revert ZeroAddressNotAllowed();
            }

            results[i].agentAddress = agentAddress;

            uint40 appId = us_.agentAddressToAgentStorage[agentAddress].permittedAppId;

            // If no app is permitted (appId == 0), leave permittedApp at default values
            if (appId != 0) {
                VincentUserStorage.AgentStorage storage agentStorage = us_.agentAddressToAgentStorage[agentAddress];
                results[i].permittedApp = PermittedApp({
                    appId: appId,
                    version: agentStorage.permittedAppVersion,
                    pkpSigner: agentStorage.pkpSigner,
                    pkpSignerPubKey: agentStorage.pkpSignerPubKey,
                    versionEnabled: as_.appIdToApp[appId].appVersions[getAppVersionIndex(
                            agentStorage.permittedAppVersion
                        )].enabled,
                    isDeleted: as_.appIdToApp[appId].isDeleted
                });
            }
        }
    }

    /**
     * @dev Gets all permitted abilities, policies, and policy parameters for a specific app and agent address
     * @param agentAddress The agent address
     * @param appId The app ID
     * @return abilities An array of abilities with their policies and parameters
     */
    function getAllAbilitiesAndPoliciesForApp(address agentAddress, uint40 appId)
        external
        view
        returns (AbilityWithPolicies[] memory abilities)
    {
        // Check for invalid agent address and app ID
        if (agentAddress == address(0)) {
            revert ZeroAddressNotAllowed();
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

        // Get the permitted app version for this agent and app
        uint24 appVersion = us_.agentAddressToAgentStorage[agentAddress].permittedAppVersion;

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
            abilities[i] = _getAbilityWithPolicies(abilityHash, agentAddress, appId, appVersion, versionedApp, us_, ls_);
        }

        return abilities;
    }

    /**
     * @dev Validates if a delegatee is permitted to execute an ability using an agent and returns all relevant policies
     * @param delegatee The address of the delegatee
     * @param agentAddress The agent address the delegatee is acting on behalf of
     * @param abilityIpfsCid The IPFS CID of the ability
     * @return validation A struct containing validation result and policy information
     */
    function validateAbilityExecutionAndGetPolicies(
        address delegatee,
        address agentAddress,
        string calldata abilityIpfsCid
    ) external view returns (AbilityExecutionValidation memory validation) {
        // Check for invalid inputs
        if (delegatee == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        if (agentAddress == address(0)) {
            revert ZeroAddressNotAllowed();
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
        uint40 appId = as_.delegateeAddressToAppId[delegatee];
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

        // Get the permitted app version for this agent and app
        uint24 appVersion = us_.agentAddressToAgentStorage[agentAddress].permittedAppVersion;

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

        // Get the ability policy storage for this agent, app, app version, and ability
        mapping(bytes32 => bytes) storage abilityPolicyParameterValues =
            us_.agentAddressToAgentStorage[agentAddress].abilityPolicyParameterValues[appVersion][hashedAbilityIpfsCid];

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
     * @notice Retrieves unpermitted app info for multiple agents
     * @dev Returns the last permitted app for agents that currently have no permitted app (permittedAppId == 0 but lastPermittedAppId != 0)
     * @param agentAddresses Array of agent addresses to query
     * @return results Array of AgentUnpermittedApp structs containing agent address and unpermitted app data
     */
    function getUnpermittedAppForAgents(address[] memory agentAddresses)
        public
        view
        returns (AgentUnpermittedApp[] memory results)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        results = new AgentUnpermittedApp[](agentAddresses.length);

        for (uint256 i; i < agentAddresses.length; i++) {
            address agentAddress = agentAddresses[i];

            if (agentAddress == address(0)) {
                revert ZeroAddressNotAllowed();
            }

            results[i].agentAddress = agentAddress;

            VincentUserStorage.AgentStorage storage agentStorage = us_.agentAddressToAgentStorage[agentAddress];

            // Check if agent has unpermitted an app (no current app but had a previous one)
            if (agentStorage.permittedAppId == 0 && agentStorage.lastPermittedAppId != 0) {
                results[i].unpermittedApp = UnpermittedApp({
                    appId: agentStorage.lastPermittedAppId,
                    previousPermittedVersion: agentStorage.lastPermittedAppVersion,
                    pkpSigner: agentStorage.lastPermittedPkpSigner,
                    pkpSignerPubKey: agentStorage.lastPermittedPkpSignerPubKey,
                    versionEnabled: as_.appIdToApp[agentStorage.lastPermittedAppId].appVersions[getAppVersionIndex(
                            agentStorage.lastPermittedAppVersion
                        )].enabled,
                    isDeleted: as_.appIdToApp[agentStorage.lastPermittedAppId].isDeleted
                });
            }
            // If permittedAppId == 0 and lastPermittedAppId == 0, the agent never had an app - leave unpermittedApp at default values
        }
    }

    /**
     * @dev Internal function to get an ability with its policies and parameters
     * @param abilityHash The hash of the ability IPFS CID
     * @param agentAddress The agent address
     * @param appVersion The app version
     * @param versionedApp The versioned app storage
     * @param us_ The user storage
     * @param ls_ The lit action storage
     * @return abilityWithPolicies The ability with its policies and parameters
     */
    function _getAbilityWithPolicies(
        bytes32 abilityHash,
        address agentAddress,
        uint40 appId,
        uint24 appVersion,
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

        // Get the ability policy storage for this agent, app, and ability
        mapping(bytes32 => bytes) storage abilityPolicyParameterValues =
            us_.agentAddressToAgentStorage[agentAddress].abilityPolicyParameterValues[appVersion][abilityHash];

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = allPolicyHashes[i];
            abilityWithPolicies.policies[i].policyIpfsCid = ls_.ipfsCidHashToIpfsCid[policyHash];
            abilityWithPolicies.policies[i].policyParameterValues = abilityPolicyParameterValues[policyHash];
        }
    }
}
