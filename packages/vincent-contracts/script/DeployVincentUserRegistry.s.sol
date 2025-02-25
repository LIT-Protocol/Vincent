// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DeployBase} from "./DeployBase.s.sol";
import {VincentUserRegistry} from "../src/VincentUserRegistry.sol";
import {VincentAppRegistry} from "../src/VincentAppRegistry.sol";
import {console} from "forge-std/console.sol";

contract DeployVincentUserRegistry is DeployBase {
    VincentUserRegistry public registry;

    function run() public {
        setUp();

        // Get VincentAppRegistry address from environment variable
        address appRegistryAddress = vm.envAddress("VINCENT_APP_REGISTRY_ADDRESS");
        if (appRegistryAddress == address(0)) {
            revert("VINCENT_APP_REGISTRY_ADDRESS not set");
        }

        _broadcast();

        // Deploy VincentUserRegistry
        registry = new VincentUserRegistry(appRegistryAddress, pkpNftFacet);

        vm.stopBroadcast();

        // Log deployment info
        console.log("VincentUserRegistry deployed to:", address(registry));
        console.log("Using VincentAppRegistry at:", appRegistryAddress);
        console.log("Using PKP NFT Facet at:", pkpNftFacet);
    }
}
