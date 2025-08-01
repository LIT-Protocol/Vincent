// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {IDiamondCut} from "../contracts/diamond-base/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../contracts/diamond-base/interfaces/IDiamondLoupe.sol";

import {DiamondCutFacet} from "../contracts/diamond-base/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../contracts/diamond-base/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../contracts/diamond-base/facets/OwnershipFacet.sol";

// Vincent-specific facets - these are the only ones that can be updated through this script
import {VincentAppFacet} from "../contracts/facets/VincentAppFacet.sol";
import {VincentAppViewFacet} from "../contracts/facets/VincentAppViewFacet.sol";
import {VincentUserFacet} from "../contracts/facets/VincentUserFacet.sol";
import {VincentUserViewFacet} from "../contracts/facets/VincentUserViewFacet.sol";

import {DiamondInit} from "../contracts/diamond-base/upgradeInitializers/DiamondInit.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

// Import the VincentDiamond to use its selector methods
import {VincentDiamond} from "../contracts/VincentDiamond.sol";
import {IERC165} from "../contracts/diamond-base/interfaces/IERC165.sol";
import {IERC173} from "../contracts/diamond-base/interfaces/IERC173.sol";

/**
 * @title UpdateFacet
 * @dev Script to update a specific Vincent facet in the Vincent Diamond contract.
 *      This script is restricted to only updating Vincent-specific facets, not core Diamond facets.
 */
contract UpdateFacet is Script {
    using Strings for string;

    // The address of the deployed diamond contract
    address public diamondAddress;
    // The private key of the deployer
    uint256 private deployerPrivateKey;
    // The facet name to update (from env)
    string public facetToUpdate;
    // RPC URL to use
    string public rpcUrl;

    /**
     * @dev Setup function to read environment variables
     */
    function setUp() public {
        // Read the diamond address from environment
        diamondAddress = vm.envAddress("VINCENT_DIAMOND_ADDRESS");
        require(diamondAddress != address(0), "Diamond address not set in environment");

        // Read the deployer private key from environment
        deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        require(deployerPrivateKey != 0, "Deployer private key not set in environment");

        // Read the facet name to update from environment
        facetToUpdate = vm.envString("FACET_TO_UPDATE");
        require(bytes(facetToUpdate).length > 0, "Facet name not set in environment");

        // Read the RPC URL from environment
        rpcUrl = vm.envString("VINCENT_DEPLOYMENT_RPC_URL");
        require(bytes(rpcUrl).length > 0, "RPC URL not set in environment");

        // Validate facet name - only allow Vincent-specific facets
        require(
            isValidFacetName(facetToUpdate), string.concat("Invalid or non-upgradeable facet name: ", facetToUpdate)
        );
    }

    /**
     * @dev Runs the update facet script
     */
    function run() public {
        console2.log("Updating Vincent facet:", facetToUpdate);
        console2.log("Diamond address:", diamondAddress);
        console2.log("Using RPC URL:", rpcUrl);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the new facet instance
        address facetAddress = deployFacet(facetToUpdate);
        console2.log("Deployed new facet at:", facetAddress);

        // Get the function selectors to replace
        bytes4[] memory selectors = getFacetSelectors(facetToUpdate);
        console2.log("Number of function selectors:", selectors.length);

        // Create a facet cut struct - using IDiamondCut.FacetCut
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: facetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        // Get the diamond cut facet instance
        IDiamondCut diamondCut = IDiamondCut(diamondAddress);

        // Execute the diamond cut
        diamondCut.diamondCut(cut, address(0), bytes(""));
        console2.log("Successfully updated facet:", facetToUpdate);

        // Stop broadcasting transactions
        vm.stopBroadcast();
    }

    /**
     * @dev Deploys a new instance of the specified facet
     * @param facetName The name of the facet to deploy
     * @return facetAddress The address of the deployed facet
     */
    function deployFacet(string memory facetName) internal returns (address facetAddress) {
        // Only allow deployment of Vincent-specific facets
        if (compareStrings(facetName, "VincentAppFacet")) {
            return address(new VincentAppFacet());
        } else if (compareStrings(facetName, "VincentAppViewFacet")) {
            return address(new VincentAppViewFacet());
        } else if (compareStrings(facetName, "VincentUserFacet")) {
            return address(new VincentUserFacet());
        } else if (compareStrings(facetName, "VincentUserViewFacet")) {
            return address(new VincentUserViewFacet());
        } else {
            revert(string.concat("Invalid or non-upgradeable facet name: ", facetName));
        }
    }

    /**
     * @dev Gets the function selectors for the specified facet from the diamond
     * @param facetName The name of the facet to get selectors for
     * @return selectors The function selectors for the facet
     */
    function getFacetSelectors(string memory facetName) internal view returns (bytes4[] memory) {
        // Get the diamond loupe facet instance
        IDiamondLoupe diamondLoupe = IDiamondLoupe(diamondAddress);

        // Get all facets in the diamond
        IDiamondLoupe.Facet[] memory facets = diamondLoupe.facets();

        // Loop through each facet to find the one with a matching name
        for (uint256 i = 0; i < facets.length; i++) {
            // Get the facet address
            address facetAddress = facets[i].facetAddress;

            // Check if the facet has a matching name - only check Vincent-specific facets
            bool isTargetFacet = false;

            if (compareStrings(facetName, "VincentAppFacet")) {
                // Check for a common selector in VincentAppFacet - using a selector from the library
                bytes4 registerAppSelector = VincentAppFacet.registerApp.selector;
                isTargetFacet = isSameFacetType(facetAddress, registerAppSelector);
            } else if (compareStrings(facetName, "VincentAppViewFacet")) {
                // Check for a common selector in VincentAppViewFacet - using a selector from the library
                bytes4 getAppSelector = VincentAppViewFacet.getAppById.selector;
                isTargetFacet = isSameFacetType(facetAddress, getAppSelector);
            } else if (compareStrings(facetName, "VincentUserFacet")) {
                // Check for a common selector in VincentUserFacet - using a selector from the library
                bytes4 registerUserSelector = VincentUserFacet.permitAppVersion.selector;
                isTargetFacet = isSameFacetType(facetAddress, registerUserSelector);
            } else if (compareStrings(facetName, "VincentUserViewFacet")) {
                // Check for a common selector in VincentUserViewFacet - using a selector from the library
                bytes4 getUserSelector = VincentUserViewFacet.getAllRegisteredAgentPkps.selector;
                isTargetFacet = isSameFacetType(facetAddress, getUserSelector);
            }

            if (isTargetFacet) {
                // Return the function selectors for this facet
                return facets[i].functionSelectors;
            }
        }

        // If we get here, the facet wasn't found in the diamond
        console2.log("Warning: Facet not found in diamond. Will use default selectors.");

        // Fall back to hard-coded selectors from the selector helper functions
        return getDefaultSelectors(facetToUpdate);
    }

    /**
     * @dev Checks if a facet address contains a specific function selector
     * @param facetAddress The facet address to check
     * @param selector The function selector to check for
     * @return isSameType Whether the facet contains the selector
     */
    function isSameFacetType(address facetAddress, bytes4 selector) internal view returns (bool) {
        IDiamondLoupe diamondLoupe = IDiamondLoupe(diamondAddress);
        address facetForSelector = diamondLoupe.facetAddress(selector);
        return facetForSelector == facetAddress;
    }

    /**
     * @dev Gets default function selectors for a facet if it can't be found in the diamond
     * @param facetName The name of the facet to get selectors for
     * @return selectors The function selectors for the facet
     */
    function getDefaultSelectors(string memory facetName) internal pure returns (bytes4[] memory) {
        // Using the same selector logic as in VincentDiamond
        if (compareStrings(facetName, "VincentAppFacet")) {
            return getVincentAppFacetSelectors();
        } else if (compareStrings(facetName, "VincentAppViewFacet")) {
            return getVincentAppViewFacetSelectors();
        } else if (compareStrings(facetName, "VincentUserFacet")) {
            return getVincentUserFacetSelectors();
        } else if (compareStrings(facetName, "VincentUserViewFacet")) {
            return getVincentUserViewFacetSelectors();
        } else {
            revert(string.concat("Invalid or non-upgradeable facet name: ", facetName));
        }
    }

    // The following functions replicate the selector methods from VincentDiamond

    /// @dev Get VincentAppFacet selectors
    function getVincentAppFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = VincentAppFacet.registerApp.selector;
        selectors[1] = VincentAppFacet.registerNextAppVersion.selector;
        selectors[2] = VincentAppFacet.enableAppVersion.selector;
        selectors[3] = VincentAppFacet.addDelegatee.selector;
        selectors[4] = VincentAppFacet.removeDelegatee.selector;
        selectors[5] = VincentAppFacet.deleteApp.selector;
        selectors[6] = VincentAppFacet.undeleteApp.selector;
        return selectors;
    }

    /// @dev Get VincentAppViewFacet selectors
    function getVincentAppViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = VincentAppViewFacet.getAppById.selector;
        selectors[1] = VincentAppViewFacet.getAppVersion.selector;
        selectors[2] = VincentAppViewFacet.getAppsByManager.selector;
        selectors[3] = VincentAppViewFacet.getAppByDelegatee.selector;
        selectors[4] = VincentAppViewFacet.getDelegatedAgentPkpTokenIds.selector;
        return selectors;
    }

    /// @dev Get VincentUserFacet selectors
    function getVincentUserFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = VincentUserFacet.permitAppVersion.selector;
        selectors[1] = VincentUserFacet.unPermitAppVersion.selector;
        selectors[2] = VincentUserFacet.setAbilityPolicyParameters.selector;
        return selectors;
    }

    /// @dev Get VincentUserViewFacet selectors
    function getVincentUserViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = VincentUserViewFacet.getAllRegisteredAgentPkps.selector;
        selectors[1] = VincentUserViewFacet.getPermittedAppVersionForPkp.selector;
        selectors[2] = VincentUserViewFacet.getAllPermittedAppIdsForPkp.selector;
        selectors[3] = VincentUserViewFacet.validateAbilityExecutionAndGetPolicies.selector;
        selectors[4] = VincentUserViewFacet.getAllAbilitiesAndPoliciesForApp.selector;
        return selectors;
    }

    /**
     * @dev Checks if a facet name is valid and upgradeable
     * @param facetName The name of the facet to check
     * @return isValid Whether the facet name is valid and upgradeable
     */
    function isValidFacetName(string memory facetName) internal pure returns (bool) {
        // Only allow Vincent-specific facets
        return compareStrings(facetName, "VincentAppFacet") || compareStrings(facetName, "VincentAppViewFacet")
            || compareStrings(facetName, "VincentUserFacet") || compareStrings(facetName, "VincentUserViewFacet");
    }

    /**
     * @dev Compares two strings for equality
     * @param a First string
     * @param b Second string
     * @return equal Whether the strings are equal
     */
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
