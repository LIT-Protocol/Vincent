// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {VincentAppFacet} from "../contracts/facets/VincentAppFacet.sol";

contract TestCommon is Test {
    function _createBasicVersionAbilities(string memory abilityIpfsCid1, string memory abilityIpfsCid2, string memory policyIpfsCid1) public pure returns (VincentAppFacet.AppVersionAbilities memory) {
        VincentAppFacet.AppVersionAbilities memory versionAbilities;
        versionAbilities.abilityIpfsCids = new string[](2);

        versionAbilities.abilityIpfsCids[0] = abilityIpfsCid1;
        versionAbilities.abilityIpfsCids[1] = abilityIpfsCid2;

        versionAbilities.abilityPolicies = new string[][](2);

        versionAbilities.abilityPolicies[0] = new string[](1);
        versionAbilities.abilityPolicies[0][0] = policyIpfsCid1;

        versionAbilities.abilityPolicies[1] = new string[](0);

        return versionAbilities;
    }
}