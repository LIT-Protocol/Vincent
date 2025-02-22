// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

abstract contract DeployBase is Script {
    // Chain-specific addresses
    address public pkpNftFacet;

    function setUp() public virtual {
        // Set chain-specific addresses based on the deployment network
        if (block.chainid == 1) {
            // Mainnet
            pkpNftFacet = address(0); // TODO: Add mainnet PKP NFT Facet address
        } else if (block.chainid == 5) {
            // Goerli
            pkpNftFacet = address(0); // TODO: Add goerli PKP NFT Facet address
        } else if (block.chainid == 80001) {
            // Mumbai
            pkpNftFacet = address(0); // TODO: Add mumbai PKP NFT Facet address
        } else {
            revert("Unsupported chain");
        }
    }

    function _broadcast() internal {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
    }
}
