// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VincentAppDelegationRegistry} from "../src/VincentAppDelegationRegistry.sol";
import {VincentAgentRegistry} from "../src/VincentAgentRegistry.sol";

contract Deploy is Script {
    function run() public {
        // Begin recording transactions for deployment
        vm.startBroadcast();

        // Deploy VincentAppDelegationRegistry first
        address pkpNftFacet = 0x487A9D096BB4B7Ac1520Cb12370e31e677B175EA; // Datil mainnet PKP NFT address
        VincentAppDelegationRegistry appDelegationRegistry = new VincentAppDelegationRegistry(pkpNftFacet);

        // Deploy VincentAgentRegistry
        VincentAgentRegistry agentRegistry = new VincentAgentRegistry(pkpNftFacet, address(appDelegationRegistry));

        vm.stopBroadcast();

        // Log the deployed addresses
        console.log("Deployment Complete!");
        console.log("-------------------");
        console.log("Contract Addresses:");
        console.log("VincentAppDelegationRegistry:", address(appDelegationRegistry));
        console.log("VincentAgentRegistry:", address(agentRegistry));
    }
}
