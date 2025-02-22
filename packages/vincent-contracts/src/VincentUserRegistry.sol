// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./VincentAppRegistry.sol";
import "./VincentTypes.sol";
import "./IPKPNftFacet.sol";

contract VincentUserRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    VincentAppRegistry public immutable VINCENT_APP_REGISTRY;
    IPKPNFTFacet public immutable PKP_NFT_FACET;

    struct User {
        EnumerableSet.UintSet permittedAppIds;
        // Role ID to Role Version to Tool IPFS CID Hash to Parameter Name Hash to Value
        mapping(uint256 => mapping(uint256 => mapping(bytes32 => mapping(bytes32 => string)))) roleToolParameterValues;
    }

    EnumerableSet.UintSet private registeredUsers;
    // PKP Token ID to User
    mapping(uint256 => User) private pkpTokenIdToUser;

    event AppPermitted(uint256 indexed pkpTokenId, uint256 indexed appId);
    event AppRevoked(uint256 indexed pkpTokenId, uint256 indexed appId);
    event ToolParameterValueSet(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed roleId,
        uint256 roleVersion,
        bytes32 toolIpfsCidHash,
        bytes32 parameterNameHash,
        string value
    );

    error NotPkpOwner(uint256 pkpTokenId, address msgSender);
    error AppNotEnabled(uint256 pkpTokenId, uint256 appId);
    error ToolNotFoundForRole(uint256 appId, uint256 roleId, uint256 roleVersion, bytes32 toolIpfsCidHash);
    error ToolDisabledForRole(uint256 appId, uint256 roleId, uint256 roleVersion, bytes32 toolIpfsCidHash);
    error ParameterNotFoundForTool(bytes32 toolIpfsCidHash, bytes32 parameterNameHash);
    error EmptyArrayInput();
    error ArrayLengthMismatch();

    modifier onlyPkpOwner(uint256 pkpTokenId) {
        if (PKP_NFT_FACET.ownerOf(pkpTokenId) != msg.sender) revert NotPkpOwner(pkpTokenId, msg.sender);
        _;
    }

    constructor(address vincentAppRegistry, address pkpNftFacet) {
        VINCENT_APP_REGISTRY = VincentAppRegistry(vincentAppRegistry);
        PKP_NFT_FACET = IPKPNFTFacet(pkpNftFacet);
    }

    function permitApps(uint256 pkpTokenId, uint256[] calldata appIds) external onlyPkpOwner(pkpTokenId) {
        if (appIds.length == 0) revert EmptyArrayInput();

        for (uint256 i = 0; i < appIds.length; i++) {
            uint256 appId = appIds[i];
            if (!VINCENT_APP_REGISTRY.isAppEnabled(appId)) revert AppNotEnabled(pkpTokenId, appId);
            if (pkpTokenIdToUser[pkpTokenId].permittedAppIds.contains(appId)) continue;

            pkpTokenIdToUser[pkpTokenId].permittedAppIds.add(appId);
            emit AppPermitted(pkpTokenId, appId);
        }
    }

    function revokeApps(uint256 pkpTokenId, uint256[] calldata appIds) external onlyPkpOwner(pkpTokenId) {
        if (appIds.length == 0) revert EmptyArrayInput();

        for (uint256 i = 0; i < appIds.length; i++) {
            uint256 appId = appIds[i];
            pkpTokenIdToUser[pkpTokenId].permittedAppIds.remove(appId);
            emit AppRevoked(pkpTokenId, appId);
        }
    }

    function setToolParameterValues(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 roleId,
        uint256 roleVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata parameterNames,
        string[][] calldata values
    ) external onlyPkpOwner(pkpTokenId) {
        if (toolIpfsCids.length == 0) revert EmptyArrayInput();
        if (toolIpfsCids.length != parameterNames.length || parameterNames.length != values.length) {
            revert ArrayLengthMismatch();
        }

        // Check if app is permitted
        if (!pkpTokenIdToUser[pkpTokenId].permittedAppIds.contains(appId)) revert AppNotEnabled(pkpTokenId, appId);

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            if (parameterNames[i].length != values[i].length) revert ArrayLengthMismatch();

            bytes32 toolIpfsCidHash = keccak256(abi.encodePacked(toolIpfsCids[i]));

            // Check if tool exists and is enabled
            (bool exists, bool enabled) = VINCENT_APP_REGISTRY.isToolInRole(appId, roleId, roleVersion, toolIpfsCidHash);
            if (!exists) revert ToolNotFoundForRole(appId, roleId, roleVersion, toolIpfsCidHash);
            if (!enabled) revert ToolDisabledForRole(appId, roleId, roleVersion, toolIpfsCidHash);

            for (uint256 j = 0; j < parameterNames[i].length; j++) {
                bytes32 parameterNameHash = keccak256(abi.encodePacked(parameterNames[i][j]));

                // Check if parameter exists for tool
                bool parameterExists = VINCENT_APP_REGISTRY.isParameterNameForTool(
                    appId, roleId, roleVersion, toolIpfsCidHash, parameterNameHash
                );
                if (!parameterExists) revert ParameterNotFoundForTool(toolIpfsCidHash, parameterNameHash);

                // Set the parameter value
                pkpTokenIdToUser[pkpTokenId].roleToolParameterValues[roleId][roleVersion][toolIpfsCidHash][parameterNameHash]
                = values[i][j];

                emit ToolParameterValueSet(
                    pkpTokenId, appId, roleId, roleVersion, toolIpfsCidHash, parameterNameHash, values[i][j]
                );
            }
        }
    }

    /**
     * View Functions
     */
    function getPermittedApps(uint256 pkpTokenId) external view returns (uint256[] memory) {
        return pkpTokenIdToUser[pkpTokenId].permittedAppIds.values();
    }

    function isAppPermitted(uint256 pkpTokenId, uint256 appId) external view returns (bool) {
        return pkpTokenIdToUser[pkpTokenId].permittedAppIds.contains(appId);
    }

    function getToolParameterValue(
        uint256 pkpTokenId,
        uint256 roleId,
        uint256 roleVersion,
        string calldata toolIpfsCid,
        string calldata parameterName
    ) external view returns (string memory) {
        bytes32 toolIpfsCidHash = keccak256(abi.encodePacked(toolIpfsCid));
        bytes32 parameterNameHash = keccak256(abi.encodePacked(parameterName));
        return getToolParameterValue(pkpTokenId, roleId, roleVersion, toolIpfsCidHash, parameterNameHash);
    }

    function getToolParameterValue(
        uint256 pkpTokenId,
        uint256 roleId,
        uint256 roleVersion,
        bytes32 toolIpfsCidHash,
        bytes32 parameterNameHash
    ) public view returns (string memory) {
        return pkpTokenIdToUser[pkpTokenId].roleToolParameterValues[roleId][roleVersion][toolIpfsCidHash][parameterNameHash];
    }

    /**
     * @notice Get all parameter values for a specific tool in a role version
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param roleId The role ID
     * @param roleVersion The role version
     * @param toolIpfsCid The tool IPFS CID
     * @return parameterNames The parameter names
     * @return values The parameter values
     */
    function getToolParameterValues(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 roleId,
        uint256 roleVersion,
        string calldata toolIpfsCid
    ) external view returns (string[] memory, string[] memory) {
        bytes32 toolIpfsCidHash = keccak256(abi.encodePacked(toolIpfsCid));
        return getToolParameterValues(pkpTokenId, appId, roleId, roleVersion, toolIpfsCidHash);
    }

    function getToolParameterValues(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 roleId,
        uint256 roleVersion,
        bytes32 toolIpfsCidHash
    ) public view returns (string[] memory parameterNames, string[] memory values) {
        // Get all parameter names for this tool from the registry
        (, bytes32[] memory parameterNameHashes) =
            VINCENT_APP_REGISTRY.getToolDetails(appId, roleId, roleVersion, toolIpfsCidHash);

        // Initialize arrays
        parameterNames = new string[](parameterNameHashes.length);
        values = new string[](parameterNameHashes.length);

        // Get values and unhashed names for each parameter
        for (uint256 i = 0; i < parameterNameHashes.length; i++) {
            parameterNames[i] = VINCENT_APP_REGISTRY.getUnhashedParameterName(parameterNameHashes[i]);
            values[i] = pkpTokenIdToUser[pkpTokenId].roleToolParameterValues[roleId][roleVersion][toolIpfsCidHash][parameterNameHashes[i]];
        }
    }

    /**
     * @notice Get all parameter values for all tools in a role version
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param roleId The role ID
     * @param roleVersion The role version
     * @return toolIpfsCids The tool IPFS CIDs
     * @return parameterNames The parameter names for each tool
     * @return values The parameter values for each tool
     */
    function getRoleVersionParameterValues(uint256 pkpTokenId, uint256 appId, uint256 roleId, uint256 roleVersion)
        external
        view
        returns (string[] memory toolIpfsCids, string[][] memory parameterNames, string[][] memory values)
    {
        // Get role details from registry
        (,,, bytes32[] memory toolIpfsCidHashes) = VINCENT_APP_REGISTRY.getRoleDetails(appId, roleId, roleVersion);

        // Initialize arrays
        toolIpfsCids = new string[](toolIpfsCidHashes.length);
        parameterNames = new string[][](toolIpfsCidHashes.length);
        values = new string[][](toolIpfsCidHashes.length);

        // Get values for each tool
        for (uint256 i = 0; i < toolIpfsCidHashes.length; i++) {
            toolIpfsCids[i] = VINCENT_APP_REGISTRY.getUnhashedToolCid(toolIpfsCidHashes[i]);
            (, bytes32[] memory parameterNameHashes) =
                VINCENT_APP_REGISTRY.getToolDetails(appId, roleId, roleVersion, toolIpfsCidHashes[i]);

            parameterNames[i] = new string[](parameterNameHashes.length);
            values[i] = new string[](parameterNameHashes.length);

            for (uint256 j = 0; j < parameterNameHashes.length; j++) {
                parameterNames[i][j] = VINCENT_APP_REGISTRY.getUnhashedParameterName(parameterNameHashes[j]);
                values[i][j] = pkpTokenIdToUser[pkpTokenId].roleToolParameterValues[roleId][roleVersion][toolIpfsCidHashes[i]][parameterNameHashes[j]];
            }
        }
    }
}
