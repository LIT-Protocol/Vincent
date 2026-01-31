// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {VincentZeroDevConfigFacet} from "../contracts/facets/VincentZeroDevConfigFacet.sol";

/**
 * @title SetEcdsaValidatorAddress
 * @notice Script to configure the ECDSA validator address in the Vincent Diamond
 * @dev This script should be used after upgrading existing contracts to set the validator address
 *
 * Environment Variables Required:
 * - VINCENT_DIAMOND_ADDRESS: Diamond contract address
 * - VINCENT_DEPLOYER_PRIVATE_KEY: Deployer private key (must be contract owner)
 * - ECDSA_VALIDATOR_ADDRESS: Address of the ZeroDev ECDSA validator contract
 * - VINCENT_DEPLOYMENT_RPC_URL: RPC URL
 *
 * ZeroDev ECDSA Validator Addresses:
 * - Base Sepolia (testnet): Check ZeroDev docs for current address
 * - Base (mainnet): Check ZeroDev docs for current address
 *
 * Example usage:
 * VINCENT_DIAMOND_ADDRESS=0x... \
 * VINCENT_DEPLOYER_PRIVATE_KEY=0x... \
 * ECDSA_VALIDATOR_ADDRESS=0x... \
 * VINCENT_DEPLOYMENT_RPC_URL=https://... \
 * forge script script/SetEcdsaValidatorAddress.sol:SetEcdsaValidatorAddress --broadcast --verify
 */
contract SetEcdsaValidatorAddress is Script {
    address public diamondAddress;
    address public ecdsaValidatorAddress;
    uint256 private deployerPrivateKey;
    string public rpcUrl;

    function setUp() public {
        diamondAddress = vm.envAddress("VINCENT_DIAMOND_ADDRESS");
        require(diamondAddress != address(0), "Diamond address not set");

        ecdsaValidatorAddress = vm.envAddress("ECDSA_VALIDATOR_ADDRESS");
        require(ecdsaValidatorAddress != address(0), "ECDSA validator address not set");

        deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        require(deployerPrivateKey != 0, "Deployer private key not set");

        rpcUrl = vm.envString("VINCENT_DEPLOYMENT_RPC_URL");
        require(bytes(rpcUrl).length > 0, "RPC URL not set");
    }

    function run() public {
        console2.log("=== Setting ECDSA Validator Address ===");
        console2.log("Diamond address:", diamondAddress);
        console2.log("ECDSA Validator address:", ecdsaValidatorAddress);

        vm.startBroadcast(deployerPrivateKey);

        VincentZeroDevConfigFacet configFacet = VincentZeroDevConfigFacet(diamondAddress);

        // Get current address (if any)
        address currentAddress = configFacet.getEcdsaValidatorAddress();
        console2.log("Current ECDSA Validator address:", currentAddress);

        // Set new address
        configFacet.setEcdsaValidatorAddress(ecdsaValidatorAddress);

        // Verify the change
        address newAddress = configFacet.getEcdsaValidatorAddress();
        require(newAddress == ecdsaValidatorAddress, "Address not set correctly");

        console2.log("Successfully set ECDSA Validator address to:", newAddress);

        vm.stopBroadcast();
    }
}
