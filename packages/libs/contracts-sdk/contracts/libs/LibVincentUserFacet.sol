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
     * @notice Emitted when a tool policy parameters are set
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedToolIpfsCid The keccak256 hash of the tool's IPFS CID
     * @param hashedToolPolicyIpfsCid The keccak256 hash of the tool policy's IPFS CID
     * @param policyParameterValues The CBOR2 encoded policy parameter values
     */
    event ToolPolicyParametersSet(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid,
        bytes32 hashedToolPolicyIpfsCid,
        bytes policyParameterValues
    );

    /**
     * @notice Emitted when a tool policy parameters are removed
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedToolIpfsCid The keccak256 hash of the tool's IPFS CID
     */
    event ToolPolicyParametersRemoved(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid
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
     * @notice Error thrown when tool and policy array lengths do not match
     */
    error ToolsAndPoliciesLengthMismatch();

    /**
     * @notice Error thrown when policy-related arrays for a specific tool have mismatched lengths
     * @param toolIndex Index of the tool in the tools array
     * @param policiesLength Length of the policies array for this tool
     * @param paramValuesLength Length of the parameter values array for this tool
     */
    error PolicyArrayLengthMismatch(
        uint256 toolIndex, uint256 policiesLength, uint256 paramValuesLength
    );

    /**
     * @notice Error thrown when parameter arrays for a specific policy have mismatched lengths
     * @param toolIndex Index of the tool in the tools array
     * @param policyIndex Index of the policy in the policies array
     * @param paramValuesLength Length of the parameter values array for this policy
     */
    error ParameterArrayLengthMismatch(
        uint256 toolIndex, uint256 policyIndex, uint256 paramValuesLength
    );

    /**
     * @notice Error thrown when a tool is not registered for an app version
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param toolIpfsCid The IPFS CID of the tool
     */
    error ToolNotRegisteredForAppVersion(uint256 appId, uint256 appVersion, string toolIpfsCid);

    /**
     * @notice Error thrown when a tool policy is not registered for an app version
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param toolIpfsCid The IPFS CID of the tool
     * @param toolPolicyIpfsCid The IPFS CID of the tool policy
     */
    error ToolPolicyNotRegisteredForAppVersion(
        uint256 appId, uint256 appVersion, string toolIpfsCid, string toolPolicyIpfsCid
    );

    /**
     * @notice Error thrown when a duplicate tool IPFS CID is provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param toolIpfsCid The IPFS CID of the tool
     */
    error DuplicateToolIpfsCid(uint256 appId, uint256 appVersion, string toolIpfsCid);
    
    /**
     * @notice Error thrown when a duplicate tool policy IPFS CID is provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param toolIpfsCid The IPFS CID of the tool
     * @param toolPolicyIpfsCid The IPFS CID of the tool policy
     */
    error DuplicateToolPolicyIpfsCid(uint256 appId, uint256 appVersion, string toolIpfsCid, string toolPolicyIpfsCid);

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
     * @notice Error thrown when an empty tool IPFS CID is provided
     */
    error EmptyToolIpfsCid();

    /**
     * @notice Error thrown when an empty policy IPFS CID is provided
     */
    error EmptyPolicyIpfsCid();

    /**
     * @notice Error thrown when not all registered tools for an app version are provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error NotAllRegisteredToolsProvided(uint256 appId, uint256 appVersion);
}