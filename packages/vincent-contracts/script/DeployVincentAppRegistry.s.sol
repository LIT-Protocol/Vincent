// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DeployBase} from "./DeployBase.s.sol";
import {VincentAppRegistry} from "../src/VincentAppRegistry.sol";
import {console} from "forge-std/console.sol";

contract DeployVincentAppRegistry is DeployBase {
    VincentAppRegistry public registry;

    function run() public {
        setUp();
        _broadcast();

        // Deploy VincentAppRegistry
        registry = new VincentAppRegistry();

        vm.stopBroadcast();

        // Log deployment info
        console.log("VincentAppRegistry deployed to:", address(registry));
    }
}
