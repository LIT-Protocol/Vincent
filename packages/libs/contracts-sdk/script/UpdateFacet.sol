// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {IDiamondCut} from "../contracts/diamond-base/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../contracts/diamond-base/interfaces/IDiamondLoupe.sol";

import {VincentAppFacet} from "../contracts/facets/VincentAppFacet.sol";
import {VincentAppViewFacet} from "../contracts/facets/VincentAppViewFacet.sol";
import {VincentUserFacet} from "../contracts/facets/VincentUserFacet.sol";
import {VincentUserViewFacet} from "../contracts/facets/VincentUserViewFacet.sol";

/**
 * @title Smart UpdateFacet with Auto-Detection
 * @dev Automatically detects what needs to be Added/Removed/Replaced by comparing 
 *      old facet selectors (from Diamond) vs new facet selectors (from contract)
 * 
 * Environment Variables Required:
 * - VINCENT_DIAMOND_ADDRESS: Diamond contract address
 * - VINCENT_DEPLOYER_PRIVATE_KEY: Deployer private key  
 * - FACET_TO_UPDATE: Facet name (VincentAppFacet, VincentAppViewFacet, etc.)
 * - VINCENT_DEPLOYMENT_RPC_URL: RPC URL
 */
contract SmartUpdateFacet is Script {

    address public diamondAddress;
    uint256 private deployerPrivateKey;
    string public facetToUpdate;
    string public rpcUrl;

    struct UpdatePlan {
        bytes4[] toRemove;    // Selectors only in old facet
        bytes4[] toAdd;       // Selectors only in new facet  
        bytes4[] toReplace;   // Selectors in both (intersection)
    }

    function setUp() public {
        diamondAddress = vm.envAddress("VINCENT_DIAMOND_ADDRESS");
        require(diamondAddress != address(0), "Diamond address not set");

        deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        require(deployerPrivateKey != 0, "Deployer private key not set");

        facetToUpdate = vm.envString("FACET_TO_UPDATE");
        require(bytes(facetToUpdate).length > 0, "Facet name not set");

        rpcUrl = vm.envString("VINCENT_DEPLOYMENT_RPC_URL");
        require(bytes(rpcUrl).length > 0, "RPC URL not set");

        require(isValidFacetName(facetToUpdate), "Invalid facet name");
    }

    function run() public {
        console2.log("=== Smart Facet Update with Auto-Detection ===");
        console2.log("Diamond address:", diamondAddress);
        console2.log("Facet to update:", facetToUpdate);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy new facet
        address newFacetAddress = deployFacet(facetToUpdate);
        console2.log("Deployed new facet at:", newFacetAddress);

        // Step 2: Get selector arrays
        bytes4[] memory oldSelectors = getOldFacetSelectors(facetToUpdate);
        bytes4[] memory newSelectors = getNewFacetSelectors(facetToUpdate);

        console2.log("Old facet selector count:", oldSelectors.length);
        console2.log("New facet selector count:", newSelectors.length);

        // Step 3: Analyze differences and create update plan
        UpdatePlan memory plan = createUpdatePlan(oldSelectors, newSelectors);
        logUpdatePlan(plan);

        executeUpdatePlan(newFacetAddress, plan);

        console2.log("Successfully completed smart facet update!");
        
        vm.stopBroadcast();
    }

    function createUpdatePlan(bytes4[] memory oldSelectors, bytes4[] memory newSelectors) 
        internal pure returns (UpdatePlan memory plan) {
        
        // Count each category to size arrays properly
        uint256 removeCount = 0;
        uint256 addCount = 0;
        uint256 replaceCount = 0;

        // Count selectors to remove (in old but not in new)
        for (uint256 i = 0; i < oldSelectors.length; i++) {
            if (!contains(newSelectors, oldSelectors[i])) {
                removeCount++;
            }
        }

        // Count selectors to add (in new but not in old)
        for (uint256 i = 0; i < newSelectors.length; i++) {
            if (!contains(oldSelectors, newSelectors[i])) {
                addCount++;
            }
        }

        // Count selectors to replace (in both old and new)
        for (uint256 i = 0; i < oldSelectors.length; i++) {
            if (contains(newSelectors, oldSelectors[i])) {
                replaceCount++;
            }
        }

        plan.toRemove = new bytes4[](removeCount);
        plan.toAdd = new bytes4[](addCount);
        plan.toReplace = new bytes4[](replaceCount);

        uint256 removeIndex = 0;
        for (uint256 i = 0; i < oldSelectors.length; i++) {
            if (!contains(newSelectors, oldSelectors[i])) {
                plan.toRemove[removeIndex] = oldSelectors[i];
                removeIndex++;
            }
        }

        uint256 addIndex = 0;
        for (uint256 i = 0; i < newSelectors.length; i++) {
            if (!contains(oldSelectors, newSelectors[i])) {
                plan.toAdd[addIndex] = newSelectors[i];
                addIndex++;
            }
        }

        uint256 replaceIndex = 0;
        for (uint256 i = 0; i < oldSelectors.length; i++) {
            if (contains(newSelectors, oldSelectors[i])) {
                plan.toReplace[replaceIndex] = oldSelectors[i];
                replaceIndex++;
            }
        }

        return plan;
    }

    function executeUpdatePlan(address newFacetAddress, UpdatePlan memory plan) internal {
        // Count total cuts needed
        uint256 cutCount = 0;
        if (plan.toRemove.length > 0) cutCount++;
        if (plan.toAdd.length > 0) cutCount++;
        if (plan.toReplace.length > 0) cutCount++;

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](cutCount);
        uint256 cutIndex = 0;

        // Remove cut
        if (plan.toRemove.length > 0) {
            console2.log("Executing REMOVE for", plan.toRemove.length, "selectors");
            cuts[cutIndex] = IDiamondCut.FacetCut({
                facetAddress: address(0),
                action: IDiamondCut.FacetCutAction.Remove,
                functionSelectors: plan.toRemove
            });
            cutIndex++;
        }

        // Replace cut
        if (plan.toReplace.length > 0) {
            console2.log("Executing REPLACE for", plan.toReplace.length, "selectors");
            cuts[cutIndex] = IDiamondCut.FacetCut({
                facetAddress: newFacetAddress,
                action: IDiamondCut.FacetCutAction.Replace,
                functionSelectors: plan.toReplace
            });
            cutIndex++;
        }

        // Add cut
        if (plan.toAdd.length > 0) {
            console2.log("Executing ADD for", plan.toAdd.length, "selectors");
            cuts[cutIndex] = IDiamondCut.FacetCut({
                facetAddress: newFacetAddress,
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: plan.toAdd
            });
            cutIndex++;
        }

        IDiamondCut(diamondAddress).diamondCut(cuts, address(0), bytes(""));
    }

    function getNewFacetSelectors(string memory facetName) internal pure returns (bytes4[] memory) {
        if (compareStrings(facetName, "VincentAppFacet")) {
            return getVincentAppFacetSelectors();
        } else if (compareStrings(facetName, "VincentAppViewFacet")) {
            return getVincentAppViewFacetSelectors();
        } else if (compareStrings(facetName, "VincentUserFacet")) {
            return getVincentUserFacetSelectors();
        } else if (compareStrings(facetName, "VincentUserViewFacet")) {
            return getVincentUserViewFacetSelectors();
        } else {
            revert("Invalid facet name");
        }
    }

    function getOldFacetSelectors(string memory facetName) internal view returns (bytes4[] memory) {
        IDiamondLoupe diamondLoupe = IDiamondLoupe(diamondAddress);
        IDiamondLoupe.Facet[] memory facets = diamondLoupe.facets();

        // Find the facet by checking for a known selector since facets don't have names
        for (uint256 i = 0; i < facets.length; i++) {
            if (isFacetOfType(facets[i].facetAddress, facetName)) {
                return facets[i].functionSelectors;
            }
        }

        revert("Facet has no selectors");
    }

    function isFacetOfType(address facetAddr, string memory facetName) internal view returns (bool) {
        IDiamondLoupe diamondLoupe = IDiamondLoupe(diamondAddress);
        
        bytes4 testSelector;
        if (compareStrings(facetName, "VincentAppFacet")) {
            testSelector = VincentAppFacet.registerApp.selector;
        } else if (compareStrings(facetName, "VincentAppViewFacet")) {
            testSelector = VincentAppViewFacet.getAppById.selector;
        } else if (compareStrings(facetName, "VincentUserFacet")) {
            testSelector = VincentUserFacet.permitAppVersion.selector;
        } else if (compareStrings(facetName, "VincentUserViewFacet")) {
            testSelector = VincentUserViewFacet.getPermittedAppVersionForPkp.selector;
        } else {
            return false;
        }
        
        return diamondLoupe.facetAddress(testSelector) == facetAddr;
    }

    function logUpdatePlan(UpdatePlan memory plan) internal pure {
        console2.log("\n=== UPDATE PLAN ===");
        
        if (plan.toRemove.length > 0) {
            console2.log("REMOVE", plan.toRemove.length, "selectors:");
            for (uint256 i = 0; i < plan.toRemove.length; i++) {
                console2.log("-", vm.toString(plan.toRemove[i]));
            }
        }

        if (plan.toAdd.length > 0) {
            console2.log("ADD", plan.toAdd.length, "selectors:");
            for (uint256 i = 0; i < plan.toAdd.length; i++) {
                console2.log("+", vm.toString(plan.toAdd[i]));
            }
        }

        if (plan.toReplace.length > 0) {
            console2.log("REPLACE", plan.toReplace.length, "selectors:");
            for (uint256 i = 0; i < plan.toReplace.length; i++) {
                console2.log("~", vm.toString(plan.toReplace[i]));
            }
        }

        console2.log("==================\n");
    }

    function deployFacet(string memory facetName) internal returns (address) {
        if (compareStrings(facetName, "VincentAppFacet")) {
            return address(new VincentAppFacet());
        } else if (compareStrings(facetName, "VincentAppViewFacet")) {
            return address(new VincentAppViewFacet());
        } else if (compareStrings(facetName, "VincentUserFacet")) {
            return address(new VincentUserFacet());
        } else if (compareStrings(facetName, "VincentUserViewFacet")) {
            return address(new VincentUserViewFacet());
        } else {
            revert("Invalid facet name");
        }
    }

    // Get default selectors for each facet type
    function getVincentAppFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = VincentAppFacet.registerApp.selector;
        selectors[1] = VincentAppFacet.registerNextAppVersion.selector;
        selectors[2] = VincentAppFacet.enableAppVersion.selector;
        selectors[3] = VincentAppFacet.addDelegatee.selector;
        selectors[4] = VincentAppFacet.removeDelegatee.selector;
        selectors[5] = VincentAppFacet.deleteApp.selector;
        selectors[6] = VincentAppFacet.undeleteApp.selector;
        selectors[7] = VincentAppFacet.setDelegatee.selector;
        return selectors;
    }

    function getVincentAppViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = VincentAppViewFacet.getAppById.selector;
        selectors[1] = VincentAppViewFacet.getAppVersion.selector;
        selectors[2] = VincentAppViewFacet.getAppsByManager.selector;
        selectors[3] = VincentAppViewFacet.getAppByDelegatee.selector;
        selectors[4] = VincentAppViewFacet.getDelegatedAgentPkpTokenIds.selector;
        selectors[5] = bytes4(keccak256("APP_PAGE_SIZE()"));
        return selectors;
    }

    function getVincentUserFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = VincentUserFacet.permitAppVersion.selector;
        selectors[1] = VincentUserFacet.unPermitAppVersion.selector;
        selectors[2] = VincentUserFacet.setAbilityPolicyParameters.selector;
        return selectors;
    }

    function getVincentUserViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = VincentUserViewFacet.getAllRegisteredAgentPkps.selector;
        selectors[1] = VincentUserViewFacet.getPermittedAppVersionForPkp.selector;
        selectors[2] = VincentUserViewFacet.getAllPermittedAppIdsForPkp.selector;
        selectors[3] = VincentUserViewFacet.validateAbilityExecutionAndGetPolicies.selector;
        selectors[4] = VincentUserViewFacet.getAllAbilitiesAndPoliciesForApp.selector;
        selectors[5] = VincentUserViewFacet.getPermittedAppsForPkps.selector;
        selectors[6] = bytes4(keccak256("AGENT_PAGE_SIZE()"));
        return selectors;
    }

    function isValidFacetName(string memory facetName) internal pure returns (bool) {
        return compareStrings(facetName, "VincentAppFacet") || 
               compareStrings(facetName, "VincentAppViewFacet") ||
               compareStrings(facetName, "VincentUserFacet") || 
               compareStrings(facetName, "VincentUserViewFacet");
    }

    function contains(bytes4[] memory array, bytes4 selector) internal pure returns (bool) {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == selector) {
                return true;
            }
        }
        return false;
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}