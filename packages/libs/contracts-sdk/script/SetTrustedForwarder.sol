// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {VincentERC2771Facet} from "../contracts/facets/VincentERC2771Facet.sol";

/**
 * @title SetTrustedForwarder Script
 * @dev Script to set the trusted forwarder address in the Vincent Diamond contract
 *
 * Environment Variables Required:
 * - VINCENT_DIAMOND_ADDRESS: Diamond contract address
 * - NEW_FORWARDER_ADDRESS: New trusted forwarder address (use 0x0000000000000000000000000000000000000000 to disable)
 * - VINCENT_DEPLOYER_PRIVATE_KEY: Deployer private key (must be diamond owner)
 * - RPC_URL: RPC URL for the target network
 *
 * Usage:
 * forge script script/SetTrustedForwarder.sol:SetTrustedForwarder \
 *   --broadcast \
 *   --private-key $VINCENT_DEPLOYER_PRIVATE_KEY \
 *   --rpc-url $RPC_URL \
 *   -vvv
 */
contract SetTrustedForwarder is Script {
    address public diamondAddress;
    address public newForwarderAddress;
    uint256 private deployerPrivateKey;

    function setUp() public {
        diamondAddress = vm.envAddress("VINCENT_DIAMOND_ADDRESS");
        require(diamondAddress != address(0), "Diamond address not set");

        newForwarderAddress = vm.envAddress("NEW_FORWARDER_ADDRESS");
        // Note: address(0) is valid - it disables EIP-2771 support

        deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        require(deployerPrivateKey != 0, "Deployer private key not set");
    }

    function run() public {
        console2.log("=== Setting Trusted Forwarder ===");
        console2.log("Diamond address:", diamondAddress);
        console2.log("New forwarder address:", newForwarderAddress);

        VincentERC2771Facet diamond = VincentERC2771Facet(diamondAddress);

        // Get current forwarder before making changes
        address currentForwarder = diamond.getTrustedForwarder();
        console2.log("Current trusted forwarder:", currentForwarder);

        if (currentForwarder == newForwarderAddress) {
            console2.log("Warning: New forwarder is the same as current forwarder. No change needed.");
            return;
        }

        vm.startBroadcast(deployerPrivateKey);

        // Set new forwarder
        diamond.setTrustedForwarder(newForwarderAddress);
        console2.log("Transaction sent to set new forwarder!");

        vm.stopBroadcast();

        // Verify the change
        address verifiedForwarder = diamond.getTrustedForwarder();
        console2.log("New verified trusted forwarder:", verifiedForwarder);

        require(verifiedForwarder == newForwarderAddress, "Forwarder not set correctly!");

        if (newForwarderAddress == address(0)) {
            console2.log("EIP-2771 meta-transaction support has been DISABLED");
        } else {
            console2.log("Successfully set new trusted forwarder!");
        }

        console2.log("===================================");
    }
}
