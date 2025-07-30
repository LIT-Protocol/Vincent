// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title LibUserFacet
 * @notice Library containing errors and events for the VincentUserFacet
 */
library LibVincentUserFacet {
    /**
     * @notice Emitted when a new user agent PKP is registered
     * @param userAddress The user's address who registered the PKP
     * @param pkpTokenId The token ID of the registered PKP
     */
    event NewUserAgentPkpRegistered(address indexed userAddress, uint256 indexed pkpTokenId);

    /**
     * @notice Emitted when an app version is permitted for a PKP
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app being permitted
     * @param appVersion The version number of the app being permitted
     */
    event AppVersionPermitted(uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed appVersion);

    /**
     * @notice Emitted when an app version permission is removed from a PKP
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app being unpermitted
     * @param appVersion The version of the app being unpermitted
     */
    event AppVersionUnPermitted(uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed appVersion);

    /**
     * @notice Emitted when a ability policy parameters are set
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedAbilityIpfsCid The keccak256 hash of the ability's IPFS CID
     * @param hashedAbilityPolicyIpfsCid The keccak256 hash of the ability policy's IPFS CID
     * @param policyParameterValues The CBOR2 encoded policy parameter values
     */
    event AbilityPolicyParametersSet(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedAbilityIpfsCid,
        bytes32 hashedAbilityPolicyIpfsCid,
        bytes policyParameterValues
    );

    /**
     * @notice Emitted when a ability policy parameters are removed
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedAbilityIpfsCid The keccak256 hash of the ability's IPFS CID
     */
    event AbilityPolicyParametersRemoved(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedAbilityIpfsCid
    );

    /**
     * @notice Error thrown when caller is not the owner of the specified PKP
     * @param pkpTokenId The token ID of the PKP
     * @param msgSender The address of the caller
     */
    error NotPkpOwner(uint256 pkpTokenId, address msgSender);

    /**
     * @notice Error thrown when an app version is already permitted for a PKP
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error AppVersionAlreadyPermitted(uint256 pkpTokenId, uint256 appId, uint256 appVersion);

    /**
     * @notice Error thrown when an app version is not permitted for a PKP
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error AppVersionNotPermitted(uint256 pkpTokenId, uint256 appId, uint256 appVersion);

    /**
     * @notice Error thrown when an app version is not enabled
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error AppVersionNotEnabled(uint256 appId, uint256 appVersion);

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
    error PolicyArrayLengthMismatch(
        uint256 abilityIndex, uint256 policiesLength, uint256 paramValuesLength
    );

    /**
     * @notice Error thrown when parameter arrays for a specific policy have mismatched lengths
     * @param abilityIndex Index of the ability in the abilities array
     * @param policyIndex Index of the policy in the policies array
     * @param paramValuesLength Length of the parameter values array for this policy
     */
    error ParameterArrayLengthMismatch(
        uint256 abilityIndex, uint256 policyIndex, uint256 paramValuesLength
    );

    /**
     * @notice Error thrown when a ability is not registered for an app version
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     */
    error AbilityNotRegisteredForAppVersion(uint256 appId, uint256 appVersion, string abilityIpfsCid);

    /**
     * @notice Error thrown when a ability policy is not registered for an app version
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     * @param abilityPolicyIpfsCid The IPFS CID of the ability policy
     */
    error AbilityPolicyNotRegisteredForAppVersion(
        uint256 appId, uint256 appVersion, string abilityIpfsCid, string abilityPolicyIpfsCid
    );

    /**
     * @notice Error thrown when a duplicate ability IPFS CID is provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     */
    error DuplicateAbilityIpfsCid(uint256 appId, uint256 appVersion, string abilityIpfsCid);
    
    /**
     * @notice Error thrown when a duplicate ability policy IPFS CID is provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCid The IPFS CID of the ability
     * @param abilityPolicyIpfsCid The IPFS CID of the ability policy
     */
    error DuplicateAbilityPolicyIpfsCid(uint256 appId, uint256 appVersion, string abilityIpfsCid, string abilityPolicyIpfsCid);

    /**
     * @notice Error thrown when invalid input is provided
     */
    error InvalidInput();

    /**
     * @notice Error thrown when a zero PKP token ID is provided
     */
    error ZeroPkpTokenId();

    /**
     * @notice Error thrown when a PKP token ID does not exist
     * @param pkpTokenId The token ID of the non-existent PKP
     */
    error PkpTokenDoesNotExist(uint256 pkpTokenId);

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
    error NotAllRegisteredAbilitiesProvided(uint256 appId, uint256 appVersion);
}