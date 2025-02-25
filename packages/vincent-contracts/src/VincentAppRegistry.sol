// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IPKPNFTFacet} from "./interfaces/IPKPNFTFacet.sol";

/**
 * @title VincentAppRegistry
 * @notice Registry for Vincent apps and their delegatees
 * @dev Manages app permissions and delegatee relationships
 *
 * This contract manages:
 * - App delegatees (addresses that can act on behalf of apps)
 * - Agent PKP permissions (which PKPs an app can use)
 * - Relationships between apps and their authorized entities
 */
contract VincentAppRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    // =============================================================
    //                           CONSTANTS
    // =============================================================

    IPKPNFTFacet public immutable PKP_NFT_FACET;

    // =============================================================
    //                            STORAGE
    // =============================================================

    // App management wallet => Set of delegatee addresses
    mapping(address => EnumerableSet.AddressSet) private _appDelegatees;

    // App management wallet => Set of agent PKPs that approved the app
    mapping(address => EnumerableSet.UintSet) private _appAgentPkps;

    // =============================================================
    //                            EVENTS
    // =============================================================

    event DelegateeAdded(address indexed appManager, address indexed delegatee);
    event DelegateeRemoved(address indexed appManager, address indexed delegatee);
    event AppPermitted(address indexed appManager, uint256 indexed agentPkpTokenId);
    event AppUnpermitted(address indexed appManager, uint256 indexed agentPkpTokenId);

    // =============================================================
    //                          CONSTRUCTOR
    // =============================================================

    constructor(address pkpNftFacet) {
        require(pkpNftFacet != address(0), "VincentAgentRegistry: zero address");
        PKP_NFT_FACET = IPKPNFTFacet(pkpNftFacet);
    }

    // =============================================================
    //                           MODIFIERS
    // =============================================================

    modifier onlyPkpOwner(uint256 agentPkpTokenId) {
        require(PKP_NFT_FACET.ownerOf(agentPkpTokenId) == msg.sender, "VincentAppRegistry: not PKP owner");
        _;
    }

    // =============================================================
    //                       MUTATIVE FUNCTIONS
    // =============================================================

    // ------------------------- Delegatee Management -------------------------

    /**
     * @notice Add a delegatee address for an app
     * @param delegatee The address to add as a delegatee
     */
    function addDelegatee(address delegatee) external {
        require(delegatee != address(0), "VincentAppRegistry: zero address");
        require(_appDelegatees[msg.sender].add(delegatee), "VincentAppRegistry: delegatee already exists");
        emit DelegateeAdded(msg.sender, delegatee);
    }

    /**
     * @notice Remove a delegatee address for an app
     * @param delegatee The address to remove as a delegatee
     */
    function removeDelegatee(address delegatee) external {
        require(_appDelegatees[msg.sender].remove(delegatee), "VincentAppRegistry: delegatee does not exist");
        emit DelegateeRemoved(msg.sender, delegatee);
    }

    // ------------------------- PKP Permission Management -------------------------

    /**
     * @notice Permit an app to use an agent PKP
     * @param appManager The app management wallet address
     * @param agentPkpTokenId The agent PKP token ID
     * @dev Only the PKP owner can call this
     */
    function permitAppForAgentPkp(address appManager, uint256 agentPkpTokenId) external onlyPkpOwner(agentPkpTokenId) {
        require(
            _appAgentPkps[appManager].add(agentPkpTokenId), "VincentAppRegistry: agent PKP already permitted for app"
        );
        emit AppPermitted(appManager, agentPkpTokenId);
    }

    /**
     * @notice Revoke an app's permission to use an agent PKP
     * @param appManager The app management wallet address
     * @param agentPkpTokenId The agent PKP token ID
     * @dev Only the PKP owner can call this
     */
    function unpermitAppForAgentPkp(address appManager, uint256 agentPkpTokenId)
        external
        onlyPkpOwner(agentPkpTokenId)
    {
        require(
            _appAgentPkps[appManager].remove(agentPkpTokenId), "VincentAppRegistry: agent PKP not permitted for app"
        );
        emit AppUnpermitted(appManager, agentPkpTokenId);
    }

    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================

    // ------------------------- Delegatee Queries -------------------------

    /**
     * @notice Check if an address is a delegatee for an app
     * @param appManager The app management wallet address
     * @param delegatee The delegatee address to check
     * @return bool True if the address is a delegatee
     */
    function isDelegatee(address appManager, address delegatee) external view returns (bool) {
        return _appDelegatees[appManager].contains(delegatee);
    }

    /**
     * @notice Get all delegatees for an app
     * @param appManager The app management wallet address
     * @return address[] Array of delegatee addresses
     */
    function getDelegatees(address appManager) external view returns (address[] memory) {
        return _appDelegatees[appManager].values();
    }

    // ------------------------- PKP Permission Queries -------------------------

    /**
     * @notice Check if an app is permitted to use an agent PKP
     * @param appManager The app management wallet address
     * @param agentPkpTokenId The agent PKP token ID
     * @return bool True if the app is permitted to use the PKP
     */
    function isAppPermittedForAgentPkp(address appManager, uint256 agentPkpTokenId) external view returns (bool) {
        return _appAgentPkps[appManager].contains(agentPkpTokenId);
    }

    /**
     * @notice Get all agent PKPs that permitted an app
     * @param appManager The app management wallet address
     * @return uint256[] Array of agent PKP token IDs
     */
    function getPermittedAgentPkpsForApp(address appManager) external view returns (uint256[] memory) {
        return _appAgentPkps[appManager].values();
    }
}
