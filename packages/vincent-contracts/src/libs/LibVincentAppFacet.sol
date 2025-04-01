// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title LibVincentAppFacet
 * @notice Library containing errors and events for the VincentAppFacet
 */
library LibVincentAppFacet {
    /**
     * @notice Emitted when a new app is registered
     * @param appId Unique identifier for the newly registered app
     * @param manager Address of the app manager
     */
    event NewAppRegistered(uint256 indexed appId, address indexed manager);

    /**
     * @notice Emitted when a new app version is registered
     * @param appId ID of the app for which a new version is registered
     * @param appVersion Version number of the newly registered app version
     * @param manager Address of the app manager who registered the new version
     */
    event NewAppVersionRegistered(uint256 indexed appId, uint256 indexed appVersion, address indexed manager);

    /**
     * @notice Emitted when an app version's enabled status is changed
     * @param appId ID of the app
     * @param appVersion Version number of the app being enabled/disabled
     * @param enabled New enabled status of the app version
     */
    event AppEnabled(uint256 indexed appId, uint256 indexed appVersion, bool indexed enabled);

    /**
     * @notice Emitted when a new authorized redirect URI is added to an app
     * @param appId ID of the app
     * @param hashedRedirectUri The keccak256 hash of the redirect URI that was added.
     *                          Original value can be retrieved using VincentAppViewFacet
     */
    event AuthorizedRedirectUriAdded(uint256 indexed appId, bytes32 indexed hashedRedirectUri);

    /**
     * @notice Emitted when an authorized redirect URI is removed from an app
     * @param appId ID of the app
     * @param hashedRedirectUri The keccak256 hash of the redirect URI that was removed.
     *                          Original value can be retrieved using VincentAppViewFacet
     */
    event AuthorizedRedirectUriRemoved(uint256 indexed appId, bytes32 indexed hashedRedirectUri);

    /**
     * @notice Emitted when a new delegatee is added to an app
     * @param appId ID of the app
     * @param delegatee Address of the delegatee added to the app
     */
    event DelegateeAdded(uint256 indexed appId, address indexed delegatee);

    /**
     * @notice Emitted when a delegatee is removed from an app
     * @param appId ID of the app
     * @param delegatee Address of the delegatee removed from the app
     */
    event DelegateeRemoved(uint256 indexed appId, address indexed delegatee);

    /**
     * @notice Emitted when a new lit action is registered
     * @param litActionIpfsCidHash The keccak256 hash of the lit action's IPFS CID that was registered
     */
    event NewLitActionRegistered(bytes32 indexed litActionIpfsCidHash);

    /**
     * @notice Error thrown when a non-manager attempts to modify an app
     * @param appId ID of the app being modified
     * @param msgSender Address that attempted the unauthorized modification
     */
    error NotAppManager(uint256 appId, address msgSender);

    /**
     * @notice Error thrown when tool and policy array lengths don't match
     * @dev This ensures each tool has appropriate policy configurations
     */
    error ToolsAndPoliciesLengthMismatch();

    /**
     * @notice Error thrown when attempting to register a delegatee already associated with an app
     * @dev Delegatees are unique to apps and cannot be used with multiple apps simultaneously
     * @param appId ID of the app the delegatee is already registered to
     * @param delegatee Address of the delegatee that is already registered
     */
    error DelegateeAlreadyRegisteredToApp(uint256 appId, address delegatee);

    /**
     * @notice Error thrown when trying to remove a delegatee not registered to the specified app
     * @param appId ID of the app from which removal was attempted
     * @param delegatee Address of the delegatee that is not registered to the app
     */
    error DelegateeNotRegisteredToApp(uint256 appId, address delegatee);

    /**
     * @notice Error thrown when trying to remove a redirect URI not registered to the app
     * @param appId ID of the app
     * @param redirectUri The redirect URI that is not registered
     */
    error RedirectUriNotRegisteredToApp(uint256 appId, string redirectUri);

    /**
     * @notice Error thrown when no redirect URIs are provided during app registration
     * @dev At least one redirect URI is required for app registration
     */
    error NoRedirectUrisProvided();

    /**
     * @notice Error thrown when trying to remove the last redirect URI of an app
     * @param appId ID of the app
     */
    error CannotRemoveLastRedirectUri(uint256 appId);

    /**
     * @notice Error thrown when trying to set app version enabled status to its current status
     * @param appId ID of the app
     * @param appVersion Version number of the app
     * @param enabled Current enabled status
     */
    error AppVersionAlreadyInRequestedState(uint256 appId, uint256 appVersion, bool enabled);

    /**
     * @notice Error thrown when trying to add a redirect URI that already exists for the app
     * @param appId ID of the app
     * @param redirectUri The redirect URI that already exists
     */
    error RedirectUriAlreadyAuthorizedForApp(uint256 appId, string redirectUri);

    /**
     * @notice Error thrown when trying to use an empty policy IPFS CID
     * @param appId ID of the app
     * @param toolIndex Index of the tool in the tools array
     */
    error EmptyPolicyIpfsCidNotAllowed(uint256 appId, uint256 toolIndex);

    /**
     * @notice Error thrown when a tool IPFS CID is empty
     * @param appId ID of the app
     * @param toolIndex Index of the tool in the tools array
     */
    error EmptyToolIpfsCidNotAllowed(uint256 appId, uint256 toolIndex);

    /**
     * @notice Error thrown when app name is empty
     */
    error EmptyAppNameNotAllowed();

    /**
     * @notice Error thrown when app description is empty
     */
    error EmptyAppDescriptionNotAllowed();

    /**
     * @notice Error thrown when a redirect URI is empty
     */
    error EmptyRedirectUriNotAllowed();

    /**
     * @notice Error thrown when a delegatee address is the zero address
     */
    error ZeroAddressDelegateeNotAllowed();

    /**
     * @notice Error thrown when no tools are provided during app version registration
     * @param appId ID of the app
     */
    error NoToolsProvided(uint256 appId);

    /**
     * @notice Error thrown when no policies are provided for a tool
     * @param appId ID of the app
     * @param toolIndex Index of the tool with no policies
     */
    error NoPoliciesProvidedForTool(uint256 appId, uint256 toolIndex);

    /**
     * @notice Error thrown when a policy parameter name is empty
     * @param appId ID of the app
     * @param toolIndex Index of the tool in the tools array
     * @param policyIndex Index of the policy in the policies array
     * @param paramIndex Index of the parameter in the parameters array
     */
    error EmptyParameterNameNotAllowed(uint256 appId, uint256 toolIndex, uint256 policyIndex, uint256 paramIndex);

    /**
     * @notice Error thrown when the top-level tool arrays have mismatched lengths
     * @param toolsLength Length of the tools array
     * @param policiesLength Length of the policies array
     * @param paramNamesLength Length of the parameter names array
     * @param paramTypesLength Length of the parameter types array
     */
    error ToolArrayDimensionMismatch(
        uint256 toolsLength, uint256 policiesLength, uint256 paramNamesLength, uint256 paramTypesLength
    );

    /**
     * @notice Error thrown when policy-related arrays for a specific tool have mismatched lengths
     * @param toolIndex Index of the tool in the tools array
     * @param policiesLength Length of the policies array for this tool
     * @param paramNamesLength Length of the parameter names array for this tool
     * @param paramTypesLength Length of the parameter types array for this tool
     */
    error PolicyArrayLengthMismatch(
        uint256 toolIndex, uint256 policiesLength, uint256 paramNamesLength, uint256 paramTypesLength
    );

    /**
     * @notice Error thrown when parameter arrays for a specific policy have mismatched lengths
     * @param toolIndex Index of the tool in the tools array
     * @param policyIndex Index of the policy in the policies array
     * @param paramNamesLength Length of the parameter names array for this policy
     * @param paramTypesLength Length of the parameter types array for this policy
     */
    error ParameterArrayLengthMismatch(
        uint256 toolIndex, uint256 policyIndex, uint256 paramNamesLength, uint256 paramTypesLength
    );
}
