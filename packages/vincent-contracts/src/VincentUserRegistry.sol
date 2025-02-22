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
    }

    EnumerableSet.UintSet private registeredUsers;
    // PKP Token ID to User
    mapping(uint256 => User) private pkpTokenIdToUser;

    error NotPkpOwner(uint256 pkpTokenId, address msgSender);

    modifier onlyPkpOwner(uint256 pkpTokenId) {
        if (PKP_NFT_FACET.ownerOf(pkpTokenId) != msg.sender) revert NotPkpOwner(pkpTokenId, msg.sender);
        _;
    }

    constructor(address vincentAppRegistry, address pkpNftFacet) {
        VINCENT_APP_REGISTRY = VincentAppRegistry(vincentAppRegistry);
        PKP_NFT_FACET = IPKPNFTFacet(pkpNftFacet);
    }

    // function permitApp(uint256 pkpTokenId, uint256 appId) external onlyPkpOwner(pkpTokenId) {
    //     if (!VINCENT_APP_REGISTRY.isAppEnabled(appId)) revert AppNotEnabled();

    //     pkpTokenIdToUser[pkpTokenId].permittedAppIds.add(appId);
    // }

    // function revokeApp(uint256 pkpTokenId, uint256 appId) external onlyPkpOwner(pkpTokenId) {
    //     pkpTokenIdToUser[pkpTokenId].permittedAppIds.remove(appId);
    // }
}