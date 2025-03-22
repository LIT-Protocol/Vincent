// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

/**
 * @title VincentUserFacet
 * @notice Handles user management for Vincent, allowing users to register PKP tokens as agents and manage app permissions
 * @dev Part of Vincent Diamond contract, providing user-facing functionality for permitting app versions
 *      and configuring tool policy parameters. This facet gives users granular control over which applications
 *      their agent PKPs can interact with and how those applications are configured.
 */
contract VincentUserFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

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
     * @notice Emitted when a tool policy parameter is set
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedToolIpfsCid The keccak256 hash of the tool's IPFS CID
     * @param hashedPolicyParameterName The keccak256 hash of the policy parameter name
     */
    event ToolPolicyParameterSet(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid,
        bytes32 hashedPolicyParameterName
    );

    /**
     * @notice Emitted when a tool policy parameter is removed
     * @param pkpTokenId The token ID of the PKP
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param hashedToolIpfsCid The keccak256 hash of the tool's IPFS CID
     * @param hashedPolicyParameterName The keccak256 hash of the policy parameter name being removed
     */
    event ToolPolicyParameterRemoved(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid,
        bytes32 hashedPolicyParameterName
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
     * @param paramNamesLength Length of the parameter names array for this tool
     * @param paramValuesLength Length of the parameter values array for this tool
     */
    error PolicyArrayLengthMismatch(
        uint256 toolIndex, uint256 policiesLength, uint256 paramNamesLength, uint256 paramValuesLength
    );

    /**
     * @notice Error thrown when parameter arrays for a specific policy have mismatched lengths
     * @param toolIndex Index of the tool in the tools array
     * @param policyIndex Index of the policy in the policies array
     * @param paramNamesLength Length of the parameter names array for this policy
     * @param paramValuesLength Length of the parameter values array for this policy
     */
    error ParameterArrayLengthMismatch(
        uint256 toolIndex, uint256 policyIndex, uint256 paramNamesLength, uint256 paramValuesLength
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
     * @notice Error thrown when a policy parameter name is not registered for an app version
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param toolIpfsCid The IPFS CID of the tool
     * @param toolPolicyIpfsCid The IPFS CID of the tool policy
     * @param policyParameterName The name of the policy parameter
     */
    error PolicyParameterNameNotRegisteredForAppVersion(
        uint256 appId, uint256 appVersion, string toolIpfsCid, string toolPolicyIpfsCid, string policyParameterName
    );

    /**
     * @notice Error thrown when invalid input is provided
     */
    error InvalidInput();

    /**
     * @notice Error thrown when a policy parameter value is empty
     * @param parameterName The name of the parameter with an empty value
     */
    error EmptyParameterValue(string parameterName);

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
     * @notice Error thrown when an empty parameter name is provided
     */
    error EmptyParameterName();

    /**
     * @notice Error thrown when duplicate parameter names are detected for a single policy
     * @param appId ID of the app
     * @param toolIndex Index of the tool in the tools array
     * @param policyIndex Index of the policy in the policies array
     * @param paramName The duplicate parameter name
     * @param firstIndex Index of the first occurrence of the parameter
     * @param duplicateIndex Index of the duplicate occurrence of the parameter
     */
    error DuplicateParameterNameNotAllowed(
        uint256 appId,
        uint256 toolIndex,
        uint256 policyIndex,
        string paramName,
        uint256 firstIndex,
        uint256 duplicateIndex
    );

    /**
     * @notice Error thrown when not all registered tools for an app version are provided
     * @param appId The ID of the app
     * @param appVersion The version of the app
     */
    error NotAllRegisteredToolsProvided(uint256 appId, uint256 appVersion);

    /**
     * @notice Modifier to verify that the caller is the owner of the specified PKP
     * @param pkpTokenId The token ID of the PKP
     */
    modifier onlyPkpOwner(uint256 pkpTokenId) {
        if (pkpTokenId == 0) {
            revert ZeroPkpTokenId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        try us_.PKP_NFT_FACET.ownerOf(pkpTokenId) returns (address owner) {
            if (owner != msg.sender) revert NotPkpOwner(pkpTokenId, msg.sender);
        } catch {
            revert PkpTokenDoesNotExist(pkpTokenId);
        }

        _;
    }

    /**
     * @notice Permits an app version for a PKP token and optionally sets tool policy parameters
     * @dev This function allows a PKP owner to authorize a specific app version to use their PKP.
     *      If the PKP was previously authorized for a different version of the same app, that
     *      permission is revoked and replaced with the new version.
     *
     * @param pkpTokenId The token ID of the PKP to permit the app version for
     * @param appId The ID of the app to permit
     * @param appVersion The version of the app to permit
     * @param toolIpfsCids Array of IPFS CIDs for tools to configure
     * @param policyIpfsCids 2D array mapping tools to their policies
     * @param policyParameterNames 3D array mapping policies to their parameter names
     * @param policyParameterValues 3D array mapping parameter names to their values
     */
    function permitAppVersion(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        bytes[][][] calldata policyParameterValues
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredAppVersion(appId, appVersion) {
        if (
            toolIpfsCids.length != policyIpfsCids.length || toolIpfsCids.length != policyParameterNames.length
                || toolIpfsCids.length != policyParameterValues.length
        ) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        uint256 currentPermittedAppVersion = agentStorage.permittedAppVersion[appId];

        if (currentPermittedAppVersion == appVersion) {
            revert AppVersionAlreadyPermitted(pkpTokenId, appId, appVersion);
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.VersionedApp storage newVersionedApp =
            as_.appIdToApp[appId].versionedApps[getVersionedAppIndex(appVersion)];

        // Check if the App Manager has disabled the App
        if (!newVersionedApp.enabled) revert AppVersionNotEnabled(appId, appVersion);

        // Check if all registered tools for this app version are provided
        if (
            newVersionedApp.toolIpfsCidHashes.length() > 0
                && toolIpfsCids.length != newVersionedApp.toolIpfsCidHashes.length()
        ) {
            revert NotAllRegisteredToolsProvided(appId, appVersion);
        }

        // Verify that every tool provided is registered and every registered tool is provided
        if (toolIpfsCids.length > 0) {
            bytes32[] memory providedToolHashes = new bytes32[](toolIpfsCids.length);
            for (uint256 i = 0; i < toolIpfsCids.length; i++) {
                providedToolHashes[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
                if (!newVersionedApp.toolIpfsCidHashes.contains(providedToolHashes[i])) {
                    revert ToolNotRegisteredForAppVersion(appId, appVersion, toolIpfsCids[i]);
                }
            }

            // Ensure all registered tools are in the provided tools array
            uint256 registeredToolCount = newVersionedApp.toolIpfsCidHashes.length();
            for (uint256 i = 0; i < registeredToolCount; i++) {
                bytes32 registeredToolHash = newVersionedApp.toolIpfsCidHashes.at(i);
                bool found = false;
                for (uint256 j = 0; j < providedToolHashes.length; j++) {
                    if (registeredToolHash == providedToolHashes[j]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    revert NotAllRegisteredToolsProvided(appId, appVersion);
                }
            }
        }

        // Check if User has permitted a previous app version,
        // if so, remove the PKP Token ID from the previous VersionedApp's delegated agent PKPs
        // before continuing with permitting the new app version
        if (currentPermittedAppVersion != 0) {
            // Get currently permitted VersionedApp
            VincentAppStorage.VersionedApp storage previousVersionedApp =
                as_.appIdToApp[appId].versionedApps[getVersionedAppIndex(currentPermittedAppVersion)];

            // Remove the PKP Token ID from the previous VersionedApp's delegated agent PKPs
            previousVersionedApp.delegatedAgentPkps.remove(pkpTokenId);

            emit AppVersionUnPermitted(pkpTokenId, appId, currentPermittedAppVersion);
        }

        // Add the PKP Token ID to the app version's delegated agent PKPs
        newVersionedApp.delegatedAgentPkps.add(pkpTokenId);

        // Set the new permitted app version
        agentStorage.permittedAppVersion[appId] = appVersion;

        // Add the app ID to the User's permitted apps set
        // .add will not add the app ID again if it is already registered
        agentStorage.permittedApps.add(appId);

        // Add pkpTokenId to the User's registered agent PKPs
        // .add will not add the PKP Token ID again if it is already registered
        if (us_.userAddressToRegisteredAgentPkps[msg.sender].add(pkpTokenId)) {
            emit NewUserAgentPkpRegistered(msg.sender, pkpTokenId);
        }

        emit AppVersionPermitted(pkpTokenId, appId, appVersion);

        // Save some gas by not calling the setToolPolicyParameters function if there are no tool policy parameters to set
        if (toolIpfsCids.length > 0) {
            _setToolPolicyParameters(
                appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterNames, policyParameterValues
            );
        }
    }

    /**
     * @notice Revokes permission for a PKP to use a specific app version
     * @dev This function removes authorization for a PKP to interact with an app version.
     *      The PKP is removed from the app version's delegated agent PKPs list and the
     *      app is removed from the PKP's permitted apps set.
     *
     * @param pkpTokenId The token ID of the PKP to revoke permission for
     * @param appId The ID of the app to unpermit
     * @param appVersion The version of the app to unpermit
     */
    function unPermitAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion)
        external
        onlyPkpOwner(pkpTokenId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId] != appVersion) {
            revert AppVersionNotPermitted(pkpTokenId, appId, appVersion);
        }

        // Remove the PKP Token ID from the App's Delegated Agent PKPs
        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.appStorage().appIdToApp[appId].versionedApps[getVersionedAppIndex(appVersion)]
            .delegatedAgentPkps
            .remove(pkpTokenId);

        // Remove the App Version from the User's Permitted App Versions
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId] = 0;

        // Remove the app from the User's permitted apps set
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.remove(appId);

        // Emit the AppVersionUnPermitted event
        emit AppVersionUnPermitted(pkpTokenId, appId, appVersion);
    }

    /**
     * @notice Sets tool policy parameters for a specific app version
     * @dev This function allows configuring policy parameters for tools associated with an app.
     *      It validates that the tools, policies, and parameters exist in the app version before
     *      storing parameter values. This is the public entry point for setting parameters without
     *      changing app version permissions.
     *
     * @param pkpTokenId The token ID of the PKP to set parameters for
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param toolIpfsCids Array of IPFS CIDs for tools to configure
     * @param policyIpfsCids 2D array mapping tools to their policies
     * @param policyParameterNames 3D array mapping policies to their parameter names
     * @param policyParameterValues 3D array mapping parameter names to their values
     */
    function setToolPolicyParameters(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        bytes[][][] calldata policyParameterValues
    ) public onlyPkpOwner(pkpTokenId) onlyRegisteredAppVersion(appId, appVersion) {
        if (toolIpfsCids.length == 0) {
            revert InvalidInput();
        }

        // Check for empty tool IPFS CIDs first
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            if (bytes(toolIpfsCids[i]).length == 0) {
                revert EmptyToolIpfsCid();
            }
        }

        // Get the app version to check registered tools
        VincentAppStorage.VersionedApp storage versionedApp =
            VincentAppStorage.appStorage().appIdToApp[appId].versionedApps[getVersionedAppIndex(appVersion)];

        // Check if all registered tools for this app version are provided
        if (versionedApp.toolIpfsCidHashes.length() != toolIpfsCids.length) {
            revert NotAllRegisteredToolsProvided(appId, appVersion);
        }

        // Verify that every tool provided is registered and every registered tool is provided
        bytes32[] memory providedToolHashes = new bytes32[](toolIpfsCids.length);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            providedToolHashes[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
            if (!versionedApp.toolIpfsCidHashes.contains(providedToolHashes[i])) {
                revert ToolNotRegisteredForAppVersion(appId, appVersion, toolIpfsCids[i]);
            }
        }

        // Ensure all registered tools are in the provided tools array
        uint256 registeredToolCount = versionedApp.toolIpfsCidHashes.length();
        for (uint256 i = 0; i < registeredToolCount; i++) {
            bytes32 registeredToolHash = versionedApp.toolIpfsCidHashes.at(i);
            bool found = false;
            for (uint256 j = 0; j < providedToolHashes.length; j++) {
                if (registeredToolHash == providedToolHashes[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                revert NotAllRegisteredToolsProvided(appId, appVersion);
            }
        }

        _setToolPolicyParameters(
            appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterNames, policyParameterValues
        );
    }

    /**
     * @notice Removes policy parameters associated with tools for a given app version
     * @dev This function verifies that the tools and policies exist before removing their parameters
     *      from user storage. It removes the specified parameter names from policies and cleans up
     *      policy references if all parameters are removed.
     *
     * @param appId The ID of the app from which policy parameters are being removed
     * @param pkpTokenId The PKP token ID for the Agent's PKP (Programmable Key Pair)
     * @param appVersion The version of the app where the policies were applied
     * @param toolIpfsCids An array of IPFS CIDs representing the tools from which policies should be removed
     * @param policyIpfsCids A 2D array mapping each tool to a list of policy IPFS CIDs to be removed
     * @param policyParameterNames A 3D array mapping each policy to a list of associated parameter names to be removed
     */
    function removeToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredAppVersion(appId, appVersion) {
        // Step 1: Validate input array lengths to ensure they are consistent.
        if (toolIpfsCids.length == 0) {
            revert InvalidInput();
        }

        uint256 toolCount = toolIpfsCids.length;
        if (toolCount != policyIpfsCids.length || toolCount != policyParameterNames.length) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        // Step 2: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Step 3: Iterate over each tool to process its policies and remove parameters.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value

            // Validate tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert EmptyToolIpfsCid();
            }

            // Check nested array lengths at policy level
            uint256 policyCount = policyIpfsCids[i].length;
            if (policyCount != policyParameterNames[i].length) {
                revert PolicyArrayLengthMismatch(i, policyCount, policyParameterNames[i].length, 0);
            }

            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 3.1: Validate that the tool exists for the specified app version.
            VincentAppStorage.VersionedApp storage versionedApp =
                as_.appIdToApp[appId].versionedApps[getVersionedAppIndex(appVersion)];
            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
                revert ToolNotRegisteredForAppVersion(appId, appVersion, toolIpfsCid);
            }

            // Step 3.2: Fetch the tool policies to check if policies exist.
            VincentAppStorage.ToolPolicies storage toolPolicies =
                versionedApp.toolIpfsCidHashToToolPolicies[hashedToolIpfsCid];

            // Step 3.3: Access the tool policy storage for the PKP owner.
            VincentUserStorage.ToolPolicyStorage storage toolStorage =
                us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[appId][hashedToolIpfsCid];

            // Step 4: Iterate through each policy associated with the tool.
            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value

                // Validate policy IPFS CID is not empty
                if (bytes(policyIpfsCid).length == 0) {
                    revert EmptyPolicyIpfsCid();
                }

                bytes32 hashedPolicyId = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 4.1: Verify that the policy exists before attempting removal.
                if (!toolPolicies.policyIpfsCidHashes.contains(hashedPolicyId)) {
                    revert ToolPolicyNotRegisteredForAppVersion(appId, appVersion, toolIpfsCid, policyIpfsCid);
                }

                // Step 4.2: Access the policy parameters storage.
                VincentUserStorage.PolicyParametersStorage storage policyParams =
                    toolStorage.policyIpfsCidHashToPolicyParametersStorage[hashedPolicyId];

                // Step 5: Iterate through parameters and remove them.
                uint256 paramCount = policyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = policyParameterNames[i][j][k]; // Cache calldata value

                    // Validate parameter name is not empty
                    if (bytes(paramName).length == 0) {
                        revert EmptyParameterName();
                    }

                    // Check for duplicate parameter names within the same policy
                    for (uint256 l = k + 1; l < paramCount; l++) {
                        if (
                            keccak256(abi.encodePacked(paramName))
                                == keccak256(abi.encodePacked(policyParameterNames[i][j][l]))
                        ) {
                            revert DuplicateParameterNameNotAllowed(appId, i, j, paramName, k, l);
                        }
                    }

                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    // Step 5.1: Only remove the parameter if it exists.
                    if (policyParams.policyParameterNameHashes.contains(hashedPolicyParameterName)) {
                        policyParams.policyParameterNameHashes.remove(hashedPolicyParameterName);
                        delete policyParams.policyParameterNameHashToValue[hashedPolicyParameterName];

                        // Step 5.2: Emit an event to record the removal of the policy parameter.
                        emit ToolPolicyParameterRemoved(
                            pkpTokenId, appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                        );
                    }
                }

                // Check if there are any parameters left for this policy
                if (policyParams.policyParameterNameHashes.length() == 0) {
                    // If no parameters left, remove the policy from the set of policies with parameters
                    toolStorage.policyIpfsCidHashesWithParameters.remove(hashedPolicyId);
                }
            }
        }
    }

    /**
     * @notice Associates policy parameters with tools for a given app version
     * @dev This internal function ensures that the provided tools, policies, and parameters are valid,
     *      then stores their corresponding values in user storage. It's called by permitAppVersion and
     *      setToolPolicyParameters to avoid code duplication.
     *
     * @param appId The ID of the app for which policies are being set
     * @param pkpTokenId The PKP token ID for the Agent's PKP (Programmable Key Pair)
     * @param appVersion The version of the app where the Tools and Policies are registered
     * @param toolIpfsCids Array of IPFS CIDs representing the tools being configured
     * @param policyIpfsCids 2D array where each tool maps to a list of policies stored on IPFS
     * @param policyParameterNames 3D array where each policy maps to a list of parameter names
     * @param policyParameterValues 3D array of parameter values matching each parameter name for a policy
     */
    function _setToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        bytes[][][] calldata policyParameterValues
    ) internal {
        // Step 1: Validate input array lengths to prevent mismatches.
        uint256 toolCount = toolIpfsCids.length;
        if (
            toolCount != policyIpfsCids.length || toolCount != policyParameterNames.length
                || toolCount != policyParameterValues.length
        ) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        // Step 2: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Step 3: Loop over each tool to process its associated policies and parameters.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value

            // Validate tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert EmptyToolIpfsCid();
            }

            // Check nested array lengths at policy level
            uint256 policyCount = policyIpfsCids[i].length;
            if (policyCount != policyParameterNames[i].length || policyCount != policyParameterValues[i].length) {
                revert PolicyArrayLengthMismatch(
                    i, policyCount, policyParameterNames[i].length, policyParameterValues[i].length
                );
            }

            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 3.1: Validate that the tool exists in the specified app version.
            VincentAppStorage.VersionedApp storage versionedApp =
                as_.appIdToApp[appId].versionedApps[getVersionedAppIndex(appVersion)];
            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
                revert ToolNotRegisteredForAppVersion(appId, appVersion, toolIpfsCid);
            }

            // Step 3.2: Access storage locations for tool policies.
            VincentAppStorage.ToolPolicies storage toolPolicies =
                versionedApp.toolIpfsCidHashToToolPolicies[hashedToolIpfsCid];

            VincentUserStorage.ToolPolicyStorage storage userToolPolicyStorage =
                us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[appId][hashedToolIpfsCid];

            // Step 4: Iterate through each policy associated with the tool.
            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value

                // Validate policy IPFS CID is not empty
                if (bytes(policyIpfsCid).length == 0) {
                    revert EmptyPolicyIpfsCid();
                }

                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 4.1: Validate that the policy is registered for the tool.
                if (!toolPolicies.policyIpfsCidHashes.contains(hashedToolPolicy)) {
                    revert ToolPolicyNotRegisteredForAppVersion(appId, appVersion, toolIpfsCid, policyIpfsCid);
                }

                // Step 4.2: Access storage for policy parameters.
                VincentUserStorage.PolicyParametersStorage storage policyParametersStorage =
                    userToolPolicyStorage.policyIpfsCidHashToPolicyParametersStorage[hashedToolPolicy];

                // Step 5: Iterate through each parameter associated with the policy.
                uint256 paramCount = policyParameterNames[i][j].length;

                // Check parameter names and values match in length
                if (paramCount != policyParameterValues[i][j].length) {
                    revert ParameterArrayLengthMismatch(i, j, paramCount, policyParameterValues[i][j].length);
                }

                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = policyParameterNames[i][j][k];
                    bytes memory paramValue = policyParameterValues[i][j][k];

                    // Validate parameter name is not empty
                    if (bytes(paramName).length == 0) {
                        revert EmptyParameterName();
                    }

                    // Check for duplicate parameter names within the same policy
                    for (uint256 l = k + 1; l < paramCount; l++) {
                        if (
                            keccak256(abi.encodePacked(paramName))
                                == keccak256(abi.encodePacked(policyParameterNames[i][j][l]))
                        ) {
                            revert DuplicateParameterNameNotAllowed(appId, i, j, paramName, k, l);
                        }
                    }

                    // Validate parameter value is not empty
                    if (paramValue.length == 0) {
                        revert EmptyParameterValue(paramName);
                    }

                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    // Step 5.1: Ensure that the parameter is valid for the specified policy.
                    VincentAppStorage.Policy storage policy = toolPolicies.policyIpfsCidHashToPolicy[hashedToolPolicy];
                    if (!policy.policyParameterNameHashes.contains(hashedPolicyParameterName)) {
                        revert PolicyParameterNameNotRegisteredForAppVersion(
                            appId, appVersion, toolIpfsCid, policyIpfsCid, paramName
                        );
                    }

                    // Step 5.2: Store the parameter name if not already added.
                    policyParametersStorage.policyParameterNameHashes.add(hashedPolicyParameterName);

                    // Step 5.3: Set the parameter value.
                    policyParametersStorage.policyParameterNameHashToValue[hashedPolicyParameterName] =
                        policyParameterValues[i][j][k];

                    // Step 5.5: Add the policy hash to the set of policies with parameters.
                    userToolPolicyStorage.policyIpfsCidHashesWithParameters.add(hashedToolPolicy);

                    // Step 5.6: Emit an event for tracking.
                    emit ToolPolicyParameterSet(
                        pkpTokenId, appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                    );
                }
            }
        }
    }
}
