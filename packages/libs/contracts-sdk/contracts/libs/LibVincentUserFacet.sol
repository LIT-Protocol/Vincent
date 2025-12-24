// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title LibUserFacet
 * @notice Library containing errors and events for the VincentUserFacet
 */
library LibVincentUserFacet {
    /**
     * @notice Emitted when a new agent is registered
     * @param userAddress The address of the user that the agent is acting on behalf of
     * @param agentAddress The address of the agent that was registered
     */
    event NewAgentRegistered(address indexed userAddress, address indexed agentAddress);

    /**
     * @notice Emitted when an app version is permitted for an agent
     * @param agentAddress The address of the agent that was permitted
     * @param appId The ID of the app being permitted
     * @param appVersion The version number of the app being permitted
     */
    event AppVersionPermitted(address indexed agentAddress, uint40 indexed appId, uint24 indexed appVersion);

    /**
     * @notice Emitted when an app version permission is removed for an agent
     * @param agentAddress The address of the agent that was unpermitted
     * @param appId The ID of the app being unpermitted
     * @param appVersion The version of the app being unpermitted
     */
    event AppVersionUnPermitted(address indexed agentAddress, uint40 indexed appId, uint24 indexed appVersion);

    /**
     * @notice Emitted when an app version is re-permitted for an agent
     * @param agentAddress The address of the agent that was re-permitted
     * @param appId The ID of the app being re-permitted
     * @param appVersion The version number of the app being re-permitted
     */
    event AppVersionRePermitted(address indexed agentAddress, uint40 indexed appId, uint24 indexed appVersion);

    /**
     * @notice Emitted when an ability policy parameters are set
     * @param agentAddress The address of the agent that the policy parameters were set for
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedAbilityIpfsCid The keccak256 hash of the ability's IPFS CID
     * @param hashedAbilityPolicyIpfsCid The keccak256 hash of the ability policy's IPFS CID
     * @param policyParameterValues The CBOR2 encoded policy parameter values
     */
    event AbilityPolicyParametersSet(
        address indexed agentAddress,
        uint40 indexed appId,
        uint24 indexed appVersion,
        bytes32 hashedAbilityIpfsCid,
        bytes32 hashedAbilityPolicyIpfsCid,
        bytes policyParameterValues
    );

    /**
     * @notice Emitted when an ability policy parameters are removed
     * @param agentAddress The address of the agent that the policy parameters were removed for
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedAbilityIpfsCid The keccak256 hash of the ability's IPFS CID
     */
    event AbilityPolicyParametersRemoved(
        address indexed agentAddress, uint40 indexed appId, uint24 indexed appVersion, bytes32 hashedAbilityIpfsCid
    );

    /**
     * @notice Error thrown when an app version is already permitted for an agent
     * @param agentAddress The address of the agent
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error AppVersionAlreadyPermitted(address agentAddress, uint40 appId, uint24 appVersion);

    /**
     * @notice Error thrown when an agent is already permitted for a different app
     * @param agentAddress The address of the agent that is already permitted for a different app
     * @param appId The ID of the app that the agent is already permitted for
     */
    error DifferentAppAlreadyPermitted(address agentAddress, uint40 appId);

    /**
     * @notice Error thrown when an app version is not permitted for an agent
     * @param agentAddress The address of the agent
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error AppVersionNotPermitted(address agentAddress, uint40 appId, uint24 appVersion);

    /**
     * @notice Error thrown when an app version is not enabled
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error AppVersionNotEnabled(uint40 appId, uint24 appVersion);

    /**
     * @notice Error thrown when ability and policy array lengths do not match
     */
    error AbilitiesAndPoliciesLengthMismatch();

    /**
     * @notice Error thrown when policy-related arrays for a specific ability have mismatched lengths
     * @param abilityIndex Index of the ability in the abilities array
     * @param policiesLength Length of the policies array for this ability
     * @param paramValuesLength Length of the parameter values array for this ability
     */
    error PolicyArrayLengthMismatch(uint256 abilityIndex, uint256 policiesLength, uint256 paramValuesLength);

    /**
     * @notice Error thrown when parameter arrays for a specific policy have mismatched lengths
     * @param abilityIndex Index of the ability in the abilities array
     * @param policyIndex Index of the policy in the policies array
     * @param paramValuesLength Length of the parameter values array for this policy
     */
    error ParameterArrayLengthMismatch(uint256 abilityIndex, uint256 policyIndex, uint256 paramValuesLength);

    /**
     * @notice Error thrown when an ability is not registered for an app version
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     */
    error AbilityNotRegisteredForAppVersion(uint40 appId, uint24 appVersion, string abilityIpfsCid);

    /**
     * @notice Error thrown when an ability policy is not registered for an app version
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     * @param abilityPolicyIpfsCid The IPFS CID of the ability policy
     */
    error AbilityPolicyNotRegisteredForAppVersion(
        uint40 appId, uint24 appVersion, string abilityIpfsCid, string abilityPolicyIpfsCid
    );

    /**
     * @notice Error thrown when a duplicate ability IPFS CID is provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     */
    error DuplicateAbilityIpfsCid(uint40 appId, uint24 appVersion, string abilityIpfsCid);

    /**
     * @notice Error thrown when a duplicate ability policy IPFS CID is provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     * @param abilityPolicyIpfsCid The IPFS CID of the ability policy
     */
    error DuplicateAbilityPolicyIpfsCid(
        uint40 appId, uint24 appVersion, string abilityIpfsCid, string abilityPolicyIpfsCid
    );

    /**
     * @notice Error thrown when invalid input is provided
     */
    error InvalidInput();

    /**
     * @notice Error thrown when an empty ability IPFS CID is provided
     */
    error EmptyAbilityIpfsCid();

    /**
     * @notice Error thrown when an empty policy IPFS CID is provided
     */
    error EmptyPolicyIpfsCid();

    /**
     * @notice Error thrown when not all registered abilities for an app version are provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error NotAllRegisteredAbilitiesProvided(uint40 appId, uint24 appVersion);

    /**
     * @notice Error thrown when an app has never been permitted for an agent, but the caller is trying to re-permit it
     * @param agentAddress The address of the agent
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error AppNeverPermitted(address agentAddress, uint40 appId, uint24 appVersion);
}
