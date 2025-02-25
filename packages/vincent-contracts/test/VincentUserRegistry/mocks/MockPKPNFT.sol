// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPKPNFTFacet} from "../../../src/IPKPNftFacet.sol";

contract MockPKPNFT is IPKPNFTFacet {
    mapping(uint256 => address) private _owners;

    function ownerOf(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "MockPKPNFT: owner query for nonexistent token");
        return _owners[tokenId];
    }

    function mint(address to, uint256 tokenId) external {
        require(_owners[tokenId] == address(0), "MockPKPNFT: token already exists");
        _owners[tokenId] = to;
    }
}
