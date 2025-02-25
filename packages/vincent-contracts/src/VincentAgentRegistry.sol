// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IPKPNFTFacet} from "./interfaces/IPKPNFTFacet.sol";
import {IVincentAppDelegationRegistry} from "./interfaces/IVincentAppDelegationRegistry.sol";

/**
 * @title VincentAgentRegistry
 * @notice Registry for Vincent agent PKPs and their permissions
 * @dev Stores the on-chain permissions and policy values for agent PKPs
 *
 * This contract manages the relationships between:
 * - Agent PKPs (Programmable Key Pairs)
 * - Apps that can use these PKPs
 * - Roles assigned to apps
 * - Tools available to apps
 * - Policy parameters and values for tools
 */
contract VincentAgentRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    // =============================================================
    //                           CONSTANTS
    // =============================================================

    IPKPNFTFacet public immutable PKP_NFT_FACET;
    IVincentAppDelegationRegistry public immutable appDelegationRegistry;

    // =============================================================
    //                            STORAGE
    // =============================================================

    struct Tool {
        bool enabled;
        string toolIpfsCid;
        EnumerableSet.Bytes32Set policyParams;
        mapping(bytes32 => bytes) policyValues;
    }

    struct App {
        bool enabled;
        EnumerableSet.Bytes32Set roleIds;
        mapping(bytes32 => string) roleVersions;
        EnumerableSet.Bytes32Set toolIds;
        mapping(bytes32 => Tool) tools;
    }

    struct AgentPkp {
        EnumerableSet.AddressSet appAddresses;
        mapping(address => App) apps;
    }

    EnumerableSet.UintSet private _agentPkps;
    // Agent PKP token ID => Agent PKP data
    mapping(uint256 => AgentPkp) private _agents;

    // App management wallet => Set of agent PKPs that approved the app
    mapping(address => EnumerableSet.UintSet) private _permittedAgentPkpsForApp;

    // Tool IPFS CID hash => Tool IPFS CID string
    mapping(bytes32 => string) private _toolIpfsCids;

    // Policy param hash => Policy param name string
    mapping(bytes32 => string) private _policyParamNames;

    // =============================================================
    //                            EVENTS
    // =============================================================

    event AppAdded(uint256 indexed agentPkpTokenId, address indexed appManager, bool enabled);
    event AppEnabled(uint256 indexed agentPkpTokenId, address indexed appManager, bool enabled);
    event RoleAdded(
        uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed roleId, string version
    );
    event ToolPolicyAdded(
        uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed toolId, string ipfsCid
    );
    event ToolEnabled(
        uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed toolId, bool enabled
    );
    event PolicyValueSet(
        uint256 indexed agentPkpTokenId,
        address indexed appManager,
        bytes32 indexed toolId,
        bytes32 paramId,
        bytes value
    );

    // =============================================================
    //                          CONSTRUCTOR
    // =============================================================

    constructor(address pkpContract_, address appDelegationRegistry_) {
        require(pkpContract_ != address(0), "VincentAgentRegistry: zero address");
        require(appDelegationRegistry_ != address(0), "VincentAgentRegistry: zero address");
        PKP_NFT_FACET = IPKPNFTFacet(pkpContract_);
        appDelegationRegistry = IVincentAppDelegationRegistry(appDelegationRegistry_);
    }

    // =============================================================
    //                           MODIFIERS
    // =============================================================

    modifier onlyPkpOwner(uint256 agentPkpTokenId) {
        require(PKP_NFT_FACET.ownerOf(agentPkpTokenId) == msg.sender, "VincentAgentRegistry: not PKP owner");
        _;
    }

    // =============================================================
    //                       MUTATIVE FUNCTIONS
    // =============================================================

    // ------------------------- Role Management -------------------------

    /**
     * @notice Add a role and its tool-policies for an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param roleId The role ID
     * @param roleVersion The role version
     * @param toolIpfsCids Array of tool IPFS CIDs
     * @param policyParamNames Array of policy parameter name arrays for each tool
     * @param policyValues Array of policy value arrays for each tool
     */
    function addRole(
        uint256 agentPkpTokenId,
        address appManager,
        bytes32 roleId,
        string calldata roleVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyParamNames,
        bytes[][] calldata policyValues
    ) external onlyPkpOwner(agentPkpTokenId) {
        require(appManager != address(0), "VincentAgentRegistry: zero address");
        require(
            toolIpfsCids.length == policyParamNames.length && policyParamNames.length == policyValues.length,
            "VincentAgentRegistry: array length mismatch"
        );

        AgentPkp storage agent = _agents[agentPkpTokenId];
        App storage app = agent.apps[appManager];

        // Do these things if app is not already permitted for the agent PKP
        if (!agent.appAddresses.contains(appManager)) {
            // Add app to agent PKP, and enable it
            agent.appAddresses.add(appManager);
            app.enabled = true;
            emit AppAdded(agentPkpTokenId, appManager, true);

            // Add agent PKP to registry
            _agentPkps.add(agentPkpTokenId);

            // Add agent PKP to app's permitted agent PKPs
            _permittedAgentPkpsForApp[appManager].add(agentPkpTokenId);
        }

        // Add role
        app.roleIds.add(roleId);
        app.roleVersions[roleId] = roleVersion;
        emit RoleAdded(agentPkpTokenId, appManager, roleId, roleVersion);

        // Add tool-policies with their parameters and values
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            require(
                policyParamNames[i].length == policyValues[i].length,
                "VincentAgentRegistry: param and value length mismatch"
            );

            bytes32 toolIpfsCidHash = keccak256(abi.encodePacked(toolIpfsCids[i]));
            app.toolIds.add(toolIpfsCidHash);

            Tool storage tool = app.tools[toolIpfsCidHash];
            tool.enabled = true;
            tool.toolIpfsCid = toolIpfsCids[i];

            // Store the tool IPFS CID mapping
            _toolIpfsCids[toolIpfsCidHash] = toolIpfsCids[i];

            // Add policy parameters and values for this tool
            for (uint256 j = 0; j < policyParamNames[i].length; j++) {
                bytes32 paramNameHash = keccak256(abi.encodePacked(policyParamNames[i][j]));
                tool.policyParams.add(paramNameHash);
                tool.policyValues[paramNameHash] = policyValues[i][j];

                // Store the policy param name if it doesn't exist yet
                if (bytes(_policyParamNames[paramNameHash]).length == 0) {
                    _policyParamNames[paramNameHash] = policyParamNames[i][j];
                }

                emit PolicyValueSet(agentPkpTokenId, appManager, toolIpfsCidHash, paramNameHash, policyValues[i][j]);
            }
        }
    }

    // ------------------------- App Management -------------------------

    /**
     * @notice Enable or disable an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param enabled Whether to enable or disable the app
     */
    function setAppEnabled(uint256 agentPkpTokenId, address appManager, bool enabled)
        external
        onlyPkpOwner(agentPkpTokenId)
    {
        require(appManager != address(0), "VincentAgentRegistry: zero address");
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");

        _agents[agentPkpTokenId].apps[appManager].enabled = enabled;
        emit AppEnabled(agentPkpTokenId, appManager, enabled);
    }

    // ------------------------- Tool Management -------------------------

    /**
     * @notice Enable or disable a tool
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolIpfsCid The tool IPFS CID
     * @param enabled Whether to enable or disable the tool
     */
    function setToolEnabled(uint256 agentPkpTokenId, address appManager, string calldata toolIpfsCid, bool enabled)
        external
        onlyPkpOwner(agentPkpTokenId)
    {
        require(appManager != address(0), "VincentAgentRegistry: zero address");
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");

        bytes32 toolId = keccak256(abi.encodePacked(toolIpfsCid));

        require(
            _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId), "VincentAgentRegistry: tool not found"
        );

        _agents[agentPkpTokenId].apps[appManager].tools[toolId].enabled = enabled;
        emit ToolEnabled(agentPkpTokenId, appManager, toolId, enabled);
    }

    /**
     * @notice Enable or disable multiple tool-policies at once
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolIpfsCids Array of tool IPFS CIDs
     * @param enabled Whether to enable or disable the tool-policies
     */
    function setToolPoliciesEnabled(
        uint256 agentPkpTokenId,
        address appManager,
        string[] calldata toolIpfsCids,
        bool enabled
    ) external onlyPkpOwner(agentPkpTokenId) {
        require(appManager != address(0), "VincentAgentRegistry: zero address");
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");

        App storage app = _agents[agentPkpTokenId].apps[appManager];

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 toolId = keccak256(abi.encodePacked(toolIpfsCids[i]));
            require(app.toolIds.contains(toolId), "VincentAgentRegistry: tool not found");

            app.tools[toolId].enabled = enabled;
            emit ToolEnabled(agentPkpTokenId, appManager, toolId, enabled);
        }
    }

    /**
     * @notice Update an existing policy parameter value
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolIpfsCid The tool IPFS CID
     * @param paramId The parameter ID
     * @param value The new parameter value
     */
    function updateToolPolicyValue(
        uint256 agentPkpTokenId,
        address appManager,
        string calldata toolIpfsCid,
        bytes32 paramId,
        bytes calldata value
    ) external onlyPkpOwner(agentPkpTokenId) {
        require(appManager != address(0), "VincentAgentRegistry: zero address");
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");

        bytes32 toolId = keccak256(abi.encodePacked(toolIpfsCid));

        require(
            _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId), "VincentAgentRegistry: tool not found"
        );

        Tool storage toolPolicy = _agents[agentPkpTokenId].apps[appManager].tools[toolId];
        require(toolPolicy.policyParams.contains(paramId), "VincentAgentRegistry: param not found");

        toolPolicy.policyValues[paramId] = value;
        emit PolicyValueSet(agentPkpTokenId, appManager, toolId, paramId, value);
    }

    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================

    // ------------------------- Agent PKP Queries -------------------------

    /**
     * @notice Check if an agent PKP exists in the registry
     * @param agentPkpTokenId The agent PKP token ID
     * @return bool True if the agent PKP exists
     */
    function hasAgentPkp(uint256 agentPkpTokenId) external view returns (bool) {
        return _agentPkps.contains(agentPkpTokenId);
    }

    /**
     * @notice Get all agent PKPs in the registry
     * @return uint256[] Array of agent PKP token IDs
     */
    function getAllAgentPkps() external view returns (uint256[] memory) {
        return _agentPkps.values();
    }

    // ------------------------- PKP Permission Queries -------------------------

    /**
     * @notice Check if an app is permitted to use an agent PKP
     * @param appManager The app management wallet address
     * @param agentPkpTokenId The agent PKP token ID
     * @return bool True if the app is permitted to use the PKP
     */
    function isAppPermittedForAgentPkp(address appManager, uint256 agentPkpTokenId) external view returns (bool) {
        return _permittedAgentPkpsForApp[appManager].contains(agentPkpTokenId);
    }

    /**
     * @notice Get all agent PKPs that permitted an app
     * @param appManager The app management wallet address
     * @return uint256[] Array of agent PKP token IDs
     */
    function getPermittedAgentPkpsForApp(address appManager) external view returns (uint256[] memory) {
        return _permittedAgentPkpsForApp[appManager].values();
    }

    // ------------------------- App Queries -------------------------

    /**
     * @notice Get all apps permitted for an agent PKP
     * @param agentPkpTokenId The agent PKP token ID
     * @return address[] Array of app addresses
     */
    function getAppsPermittedForAgentPkp(uint256 agentPkpTokenId) external view returns (address[] memory) {
        require(_agentPkps.contains(agentPkpTokenId), "VincentAgentRegistry: agent PKP not found");
        return _agents[agentPkpTokenId].appAddresses.values();
    }

    /**
     * @notice Check if an app is enabled for an agent PKP
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @return bool True if the app is enabled
     */
    function isAppEnabled(uint256 agentPkpTokenId, address appManager) external view returns (bool) {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        return _agents[agentPkpTokenId].apps[appManager].enabled;
    }

    /**
     * @notice Get the complete app information for a given delegatee and agent PKP
     * @param delegatee The delegatee address
     * @param agentPkpTokenId The agent PKP token ID
     * @return appManager The app manager address that the delegatee belongs to
     * @return isEnabled Whether the app is enabled
     * @return toolIpfsCids Array of tool IPFS CIDs
     * @return toolEnabled Array of booleans indicating if each tool is enabled
     * @return policyParamNames Array of arrays of policy parameter names for each tool
     * @return policyValues Array of arrays of policy values for each tool
     */
    function getAppByDelegateeForAgentPkp(address delegatee, uint256 agentPkpTokenId)
        external
        view
        returns (
            address appManager,
            bool isEnabled,
            string[] memory toolIpfsCids,
            bool[] memory toolEnabled,
            string[][] memory policyParamNames,
            bytes[][] memory policyValues
        )
    {
        require(delegatee != address(0), "VincentAgentRegistry: zero address");
        require(_agentPkps.contains(agentPkpTokenId), "VincentAgentRegistry: agent PKP not found");

        appManager = appDelegationRegistry.getAppManagerByDelegatee(delegatee);
        require(appManager != address(0), "VincentAgentRegistry: delegatee not found");
        require(
            _agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found for PKP"
        );

        App storage app = _agents[agentPkpTokenId].apps[appManager];

        // Get app enabled status
        isEnabled = app.enabled;

        // Get tools information
        bytes32[] memory toolIds = app.toolIds.values();
        toolIpfsCids = new string[](toolIds.length);
        toolEnabled = new bool[](toolIds.length);
        policyParamNames = new string[][](toolIds.length);
        policyValues = new bytes[][](toolIds.length);

        for (uint256 i = 0; i < toolIds.length; i++) {
            Tool storage tool = app.tools[toolIds[i]];
            toolIpfsCids[i] = tool.toolIpfsCid;
            toolEnabled[i] = tool.enabled;

            // Get policy parameters and values
            bytes32[] memory paramIds = tool.policyParams.values();
            policyParamNames[i] = new string[](paramIds.length);
            policyValues[i] = new bytes[](paramIds.length);

            for (uint256 j = 0; j < paramIds.length; j++) {
                policyParamNames[i][j] = _policyParamNames[paramIds[j]];
                policyValues[i][j] = tool.policyValues[paramIds[j]];
            }
        }
    }

    // ------------------------- Role Queries -------------------------

    /**
     * @notice Get all roles for an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @return bytes32[] Array of role IDs
     */
    function getRolesPermittedForApp(uint256 agentPkpTokenId, address appManager)
        external
        view
        returns (bytes32[] memory)
    {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        return _agents[agentPkpTokenId].apps[appManager].roleIds.values();
    }

    /**
     * @notice Check if a role exists for an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param roleId The role ID
     * @return bool True if the role exists
     */
    function hasRole(uint256 agentPkpTokenId, address appManager, bytes32 roleId) external view returns (bool) {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        return _agents[agentPkpTokenId].apps[appManager].roleIds.contains(roleId);
    }

    /**
     * @notice Get the version for a role
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param roleId The role ID
     * @return string The role version
     */
    function getRoleVersion(uint256 agentPkpTokenId, address appManager, bytes32 roleId)
        external
        view
        returns (string memory)
    {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        require(
            _agents[agentPkpTokenId].apps[appManager].roleIds.contains(roleId), "VincentAgentRegistry: role not found"
        );
        return _agents[agentPkpTokenId].apps[appManager].roleVersions[roleId];
    }

    /**
     * @notice Get all roles and their versions for an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @return roleIds Array of role IDs
     * @return versions Array of corresponding versions
     */
    function getRolesWithVersions(uint256 agentPkpTokenId, address appManager)
        external
        view
        returns (bytes32[] memory roleIds, string[] memory versions)
    {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");

        App storage app = _agents[agentPkpTokenId].apps[appManager];
        roleIds = app.roleIds.values();
        versions = new string[](roleIds.length);

        for (uint256 i = 0; i < roleIds.length; i++) {
            versions[i] = app.roleVersions[roleIds[i]];
        }
    }

    // ------------------------- Tool Queries -------------------------

    /**
     * @notice Get all tools for an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @return bytes32[] Array of tool IDs
     */
    function getToolsPermittedForApp(uint256 agentPkpTokenId, address appManager)
        external
        view
        returns (bytes32[] memory)
    {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        return _agents[agentPkpTokenId].apps[appManager].toolIds.values();
    }

    /**
     * @notice Check if a tool exists for an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolId The tool ID
     * @return bool True if the tool exists
     */
    function hasTool(uint256 agentPkpTokenId, address appManager, bytes32 toolId) external view returns (bool) {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        return _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId);
    }

    /**
     * @notice Check if a tool is enabled
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolId The tool ID
     * @return bool True if the tool is enabled
     */
    function isToolEnabled(uint256 agentPkpTokenId, address appManager, bytes32 toolId) external view returns (bool) {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        require(
            _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId), "VincentAgentRegistry: tool not found"
        );
        return _agents[agentPkpTokenId].apps[appManager].tools[toolId].enabled;
    }

    /**
     * @notice Get the IPFS CID for a tool
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolId The tool ID
     * @return string The tool's IPFS CID
     */
    function getToolIpfsCid(uint256 agentPkpTokenId, address appManager, bytes32 toolId)
        external
        view
        returns (string memory)
    {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        require(
            _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId), "VincentAgentRegistry: tool not found"
        );
        return _agents[agentPkpTokenId].apps[appManager].tools[toolId].toolIpfsCid;
    }

    /**
     * @notice Get all tool IDs and their IPFS CIDs for an app
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @return toolIds Array of tool IDs
     * @return ipfsCids Array of corresponding IPFS CIDs
     */
    function getToolsWithIpfsCids(uint256 agentPkpTokenId, address appManager)
        external
        view
        returns (bytes32[] memory toolIds, string[] memory ipfsCids)
    {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");

        App storage app = _agents[agentPkpTokenId].apps[appManager];
        toolIds = app.toolIds.values();
        ipfsCids = new string[](toolIds.length);

        for (uint256 i = 0; i < toolIds.length; i++) {
            ipfsCids[i] = app.tools[toolIds[i]].toolIpfsCid;
        }
    }

    // ------------------------- Policy Queries -------------------------

    /**
     * @notice Get all policy parameters for a tool
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolIpfsCid The tool IPFS CID
     * @return bytes32[] Array of parameter IDs
     */
    function getPolicyParamsForTool(uint256 agentPkpTokenId, address appManager, string calldata toolIpfsCid)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32 toolId = keccak256(abi.encodePacked(toolIpfsCid));
        require(
            _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId), "VincentAgentRegistry: tool not found"
        );
        return _agents[agentPkpTokenId].apps[appManager].tools[toolId].policyParams.values();
    }

    /**
     * @notice Get a policy parameter value
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolId The tool ID
     * @param paramId The parameter ID
     * @return bytes The parameter value
     */
    function getPolicyValue(uint256 agentPkpTokenId, address appManager, bytes32 toolId, bytes32 paramId)
        external
        view
        returns (bytes memory)
    {
        require(_agents[agentPkpTokenId].appAddresses.contains(appManager), "VincentAgentRegistry: app not found");
        require(
            _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId), "VincentAgentRegistry: tool not found"
        );

        Tool storage toolPolicy = _agents[agentPkpTokenId].apps[appManager].tools[toolId];
        require(toolPolicy.policyParams.contains(paramId), "VincentAgentRegistry: param not found");

        return toolPolicy.policyValues[paramId];
    }

    /**
     * @notice Get all policy parameters and their values for a tool
     * @param agentPkpTokenId The agent PKP token ID
     * @param appManager The app management wallet address
     * @param toolIpfsCid The tool IPFS CID
     * @return paramIds Array of parameter IDs
     * @return values Array of corresponding values
     */
    function getPolicyParamsWithValues(uint256 agentPkpTokenId, address appManager, string calldata toolIpfsCid)
        external
        view
        returns (bytes32[] memory paramIds, bytes[] memory values)
    {
        bytes32 toolId = keccak256(abi.encodePacked(toolIpfsCid));
        require(
            _agents[agentPkpTokenId].apps[appManager].toolIds.contains(toolId), "VincentAgentRegistry: tool not found"
        );

        Tool storage toolPolicy = _agents[agentPkpTokenId].apps[appManager].tools[toolId];
        paramIds = toolPolicy.policyParams.values();
        values = new bytes[](paramIds.length);

        for (uint256 i = 0; i < paramIds.length; i++) {
            values[i] = toolPolicy.policyValues[paramIds[i]];
        }
    }

    // ------------------------- Utility Functions -------------------------

    /**
     * @notice Get the tool ID for a tool IPFS CID
     * @param toolIpfsCid The tool IPFS CID
     * @return bytes32 The tool ID
     */
    function getToolId(string calldata toolIpfsCid) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(toolIpfsCid));
    }

    /**
     * @notice Get the name for a policy parameter
     * @param paramId The parameter ID (hash)
     * @return string The parameter name
     */
    function getPolicyParamName(bytes32 paramId) external view returns (string memory) {
        string memory name = _policyParamNames[paramId];
        require(bytes(name).length > 0, "VincentAgentRegistry: param name not found");
        return name;
    }

    /**
     * @notice Get the IPFS CID for a tool
     * @param toolId The tool ID (hash)
     * @return string The IPFS CID
     */
    function getToolIpfsCidByHash(bytes32 toolId) external view returns (string memory) {
        string memory ipfsCid = _toolIpfsCids[toolId];
        require(bytes(ipfsCid).length > 0, "VincentAgentRegistry: IPFS CID not found");
        return ipfsCid;
    }
}
