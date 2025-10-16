// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {VincentAppFacet} from "../../contracts/facets/VincentAppFacet.sol";
import {TestCommon} from "../TestCommon.sol";
import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";
import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";

import {MockPKPNftFacet} from "../mocks/MockPKPNftFacet.sol";


contract FeeTestCommon is TestCommon {

    function _deployFeeDiamond() public returns (address) {
        DeployFeeDiamond deployScript = new DeployFeeDiamond();
        address diamondAddress = deployScript.deployToNetwork("test", keccak256("testSalt"));
        return diamondAddress;
    }

    function _deployVincentDiamondAndBasicApp(address appManager, address appDelegatee, uint40 appId) public returns (address) {
        DeployVincentDiamond vincentDeployScript = new DeployVincentDiamond();
        MockPKPNftFacet mockPkpNft = new MockPKPNftFacet();

        address diamondAddress = vincentDeployScript.deployToNetwork("test", address(mockPkpNft));
        VincentAppFacet vincentAppFacet = VincentAppFacet(diamondAddress);

        // register the app
        vm.startPrank(appManager);
        address[] memory delegatees = new address[](1);
        delegatees[0] = appDelegatee;
        vincentAppFacet.registerApp(
            appId, delegatees, _createBasicVersionAbilities("QmAbility1", "QmAbility2", "QmPolicy1")
        );
        vm.stopPrank();

        return diamondAddress;
    }
}
