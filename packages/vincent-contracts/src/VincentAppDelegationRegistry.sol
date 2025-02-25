// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IPKPNFTFacet} from "./interfaces/IPKPNFTFacet.sol";

/**
 * @title VincentAppDelegationRegistry
 * @notice Registry for Vincent apps and their delegatees
 * @dev Manages app permissions and delegatee relationships
 *
 * This contract manages:
 * - App delegatees (addresses that can act on behalf of apps)
 * - Agent PKP permissions (which PKPs an app can use)
 * - Relationships between apps and their authorized entities
 */
contract VincentAppDelegationRegistry {
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

    // App Delegatee address => App Manager address
    mapping(address => address) private _appDelegateesToAppManager;

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
        _appDelegateesToAppManager[delegatee] = msg.sender;
        emit DelegateeAdded(msg.sender, delegatee);
    }

    /**
     * @notice Remove a delegatee address for an app
     * @param delegatee The address to remove as a delegatee
     */
    function removeDelegatee(address delegatee) external {
        require(_appDelegatees[msg.sender].remove(delegatee), "VincentAppRegistry: delegatee does not exist");
        _appDelegateesToAppManager[delegatee] = address(0);
        emit DelegateeRemoved(msg.sender, delegatee);
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

    // ------------------------- App Management -------------------------

    /**
     * @notice Get the app manager for a delegatee
     * @param delegatee The delegatee address
     * @return address The app manager address
     */
    function getAppManagerByDelegatee(address delegatee) external view returns (address) {
        return _appDelegateesToAppManager[delegatee];
    }
}
