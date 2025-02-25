// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PKP NFT Facet Interface
/// @notice Interface for interacting with the PKP NFT diamond facet
/// @dev Implements minimal ERC-721 functionality needed for PKP tool policies
interface IPKPNFTFacet {
    /// @notice Retrieves the owner of a PKP token
    /// @dev Implements ERC-721's ownerOf function
    /// @param tokenId The ID of the PKP token to query
    /// @return The address of the PKP token owner
    function ownerOf(uint256 tokenId) external view returns (address);
}
