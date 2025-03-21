// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../../src/IPKPNftFacet.sol";

/**
 * @title MockPKPNftFacet
 * @notice Mock implementation of the PKP NFT interface for testing
 */
contract MockPKPNftFacet is IPKPNFTFacet {
    // Mapping from token ID to owner
    mapping(uint256 => address) private _owners;

    /**
     * @notice Sets the owner of a PKP token ID (for testing)
     * @param tokenId Token ID to set owner for
     * @param owner Address to set as owner
     */
    function setOwner(uint256 tokenId, address owner) external {
        _owners[tokenId] = owner;
    }

    /**
     * @notice Retrieves the owner of a PKP token
     * @param tokenId The ID of the PKP token to query
     * @return The address of the PKP token owner
     */
    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }
}
