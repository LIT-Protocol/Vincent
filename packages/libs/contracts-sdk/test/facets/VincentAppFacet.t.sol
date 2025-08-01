// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";
import {MockPKPNftFacet} from "../mocks/MockPKPNftFacet.sol";

import {VincentDiamond} from "../../contracts/VincentDiamond.sol";
import {VincentAppFacet} from "../../contracts/facets/VincentAppFacet.sol";
import {VincentAppViewFacet} from "../../contracts/facets/VincentAppViewFacet.sol";
import {VincentUserFacet} from "../../contracts/facets/VincentUserFacet.sol";
import {VincentUserViewFacet} from "../../contracts/facets/VincentUserViewFacet.sol";

import {LibVincentAppFacet} from "../../contracts/libs/LibVincentAppFacet.sol";
import {VincentBase} from "../../contracts/VincentBase.sol";

contract VincentAppFacetTest is Test {
    uint256 constant PKP_TOKEN_ID_1 = 1;
    uint256 constant PKP_TOKEN_ID_2 = 2;

    string constant TOOL_IPFS_CID_1 = "QmAbility1";
    string constant TOOL_IPFS_CID_2 = "QmAbility2";
    string constant TOOL_IPFS_CID_3 = "QmAbility3";

    string constant POLICY_IPFS_CID_1 = "QmPolicy1";
    string constant POLICY_IPFS_CID_2 = "QmPolicy2";
    string constant POLICY_IPFS_CID_3 = "QmPolicy3";

    bytes constant POLICY_PARAMETER_VALUES_1 = abi.encode(1);
    bytes constant POLICY_PARAMETER_VALUES_2 = abi.encode(2);
    bytes constant POLICY_PARAMETER_VALUES_3 = abi.encode(3);

    address APP_MANAGER_ALICE = makeAddr("Alice");
    address APP_MANAGER_BOB = makeAddr("Bob");

    address APP_DELEGATEE_CHARLIE = makeAddr("Charlie");
    address APP_DELEGATEE_DAVID = makeAddr("David");
    address APP_DELEGATEE_EVE = makeAddr("Eve");

    address APP_USER_FRANK = makeAddr("Frank");
    address APP_USER_GEORGE = makeAddr("George");

    VincentDiamond public vincentDiamond;
    VincentAppFacet public vincentAppFacet;
    VincentAppViewFacet public vincentAppViewFacet;
    VincentUserFacet public vincentUserFacet;
    VincentUserViewFacet public vincentUserViewFacet;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));

        DeployVincentDiamond deployScript = new DeployVincentDiamond();
        MockPKPNftFacet mockPkpNft = new MockPKPNftFacet();

        address diamondAddress = deployScript.deployToNetwork("test", address(mockPkpNft));
        vincentDiamond = VincentDiamond(payable(diamondAddress));

        mockPkpNft.setOwner(PKP_TOKEN_ID_1, APP_USER_FRANK);
        mockPkpNft.setOwner(PKP_TOKEN_ID_2, APP_USER_GEORGE);

        vincentAppFacet = VincentAppFacet(diamondAddress);
        vincentAppViewFacet = VincentAppViewFacet(diamondAddress);
        vincentUserFacet = VincentUserFacet(diamondAddress);
        vincentUserViewFacet = VincentUserViewFacet(diamondAddress);
    }

    function testRegisterApp() public {
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewAppRegistered(1, APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewLitActionRegistered(keccak256(abi.encodePacked(TOOL_IPFS_CID_1)));
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewLitActionRegistered(keccak256(abi.encodePacked(TOOL_IPFS_CID_2)));
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewAppVersionRegistered(1, 1, APP_MANAGER_ALICE);
        
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId);

        VincentAppViewFacet.App memory app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        VincentAppViewFacet.AppVersion memory appVersion;
        (app, appVersion) = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
        assertEq(appVersion.delegatedAgentPkpTokenIds.length, 0);
        assertEq(appVersion.abilities.length, 2);

        assertEq(appVersion.abilities[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(appVersion.abilities[0].policyIpfsCids.length, 1);
        assertEq(appVersion.abilities[0].policyIpfsCids[0], POLICY_IPFS_CID_1);

        assertEq(appVersion.abilities[1].abilityIpfsCid, TOOL_IPFS_CID_2);
        assertEq(appVersion.abilities[1].policyIpfsCids.length, 0);

        VincentAppViewFacet.AppWithVersions[] memory apps = vincentAppViewFacet.getAppsByManager(APP_MANAGER_ALICE);
        assertEq(apps.length, 1);
        assertEq(apps[0].app.id, newAppId);
        assertFalse(apps[0].app.isDeleted);
        assertEq(apps[0].app.manager, APP_MANAGER_ALICE);
        assertEq(apps[0].app.latestVersion, newAppVersion);
        assertEq(apps[0].versions.length, 1);
        assertEq(apps[0].versions[0].version, newAppVersion);
        assertTrue(apps[0].versions[0].enabled);
        assertEq(apps[0].versions[0].abilities.length, 2);
        assertEq(apps[0].versions[0].abilities[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(apps[0].versions[0].abilities[0].policyIpfsCids.length, 1);
        assertEq(apps[0].versions[0].abilities[0].policyIpfsCids[0], POLICY_IPFS_CID_1);
        assertEq(apps[0].versions[0].abilities[1].abilityIpfsCid, TOOL_IPFS_CID_2);
        assertEq(apps[0].versions[0].abilities[1].policyIpfsCids.length, 0);

        /**
         * Now testing registering the next version of the app
         */

        VincentAppFacet.AppVersionAbilities memory versionAbilities_newAppVersion;
        versionAbilities_newAppVersion.abilityIpfsCids = new string[](3);

        versionAbilities_newAppVersion.abilityIpfsCids[0] = TOOL_IPFS_CID_1;
        versionAbilities_newAppVersion.abilityIpfsCids[1] = TOOL_IPFS_CID_2;
        versionAbilities_newAppVersion.abilityIpfsCids[2] = TOOL_IPFS_CID_3;

        versionAbilities_newAppVersion.abilityPolicies = new string[][](3);

        versionAbilities_newAppVersion.abilityPolicies[0] = new string[](1);
        versionAbilities_newAppVersion.abilityPolicies[0][0] = POLICY_IPFS_CID_1;

        versionAbilities_newAppVersion.abilityPolicies[1] = new string[](0);

        versionAbilities_newAppVersion.abilityPolicies[2] = new string[](3);
        versionAbilities_newAppVersion.abilityPolicies[2][0] = POLICY_IPFS_CID_1;
        versionAbilities_newAppVersion.abilityPolicies[2][1] = POLICY_IPFS_CID_2;
        versionAbilities_newAppVersion.abilityPolicies[2][2] = POLICY_IPFS_CID_3;

        vm.startPrank(APP_MANAGER_ALICE);
        (newAppVersion) = vincentAppFacet.registerNextAppVersion(newAppId, versionAbilities_newAppVersion);
        vm.stopPrank();

        assertEq(newAppVersion, 2);

        app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        (app, appVersion) = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
        assertEq(appVersion.delegatedAgentPkpTokenIds.length, 0);
        assertEq(appVersion.abilities.length, 3);

        assertEq(appVersion.abilities[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(appVersion.abilities[0].policyIpfsCids.length, 1);
        assertEq(appVersion.abilities[0].policyIpfsCids[0], POLICY_IPFS_CID_1);

        assertEq(appVersion.abilities[1].abilityIpfsCid, TOOL_IPFS_CID_2);
        assertEq(appVersion.abilities[1].policyIpfsCids.length, 0);

        assertEq(appVersion.abilities[2].abilityIpfsCid, TOOL_IPFS_CID_3);
        assertEq(appVersion.abilities[2].policyIpfsCids.length, 3);
        assertEq(appVersion.abilities[2].policyIpfsCids[0], POLICY_IPFS_CID_1);
        assertEq(appVersion.abilities[2].policyIpfsCids[1], POLICY_IPFS_CID_2);
        assertEq(appVersion.abilities[2].policyIpfsCids[2], POLICY_IPFS_CID_3);

        apps = vincentAppViewFacet.getAppsByManager(APP_MANAGER_ALICE);
        assertEq(apps.length, 1);
        assertEq(apps[0].app.id, newAppId);
        assertFalse(apps[0].app.isDeleted);
        assertEq(apps[0].app.manager, APP_MANAGER_ALICE);
        assertEq(apps[0].app.latestVersion, newAppVersion);
        assertEq(apps[0].app.delegatees.length, 1);
        assertEq(apps[0].app.delegatees[0], APP_DELEGATEE_CHARLIE);

        assertEq(apps[0].versions.length, 2);
        assertEq(apps[0].versions[0].version, 1);
        assertTrue(apps[0].versions[0].enabled);
        assertEq(apps[0].versions[0].abilities.length, 2);
        assertEq(apps[0].versions[0].abilities[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(apps[0].versions[0].abilities[0].policyIpfsCids.length, 1);
        assertEq(apps[0].versions[0].abilities[0].policyIpfsCids[0], POLICY_IPFS_CID_1);

        assertEq(apps[0].versions[0].abilities[1].abilityIpfsCid, TOOL_IPFS_CID_2);
        assertEq(apps[0].versions[0].abilities[1].policyIpfsCids.length, 0);

        assertEq(apps[0].versions[1].version, newAppVersion);
        assertTrue(apps[0].versions[1].enabled);
        assertEq(apps[0].versions[1].abilities.length, 3);
        assertEq(apps[0].versions[1].abilities[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(apps[0].versions[1].abilities[0].policyIpfsCids.length, 1);
        assertEq(apps[0].versions[1].abilities[0].policyIpfsCids[0], POLICY_IPFS_CID_1);

        assertEq(apps[0].versions[1].abilities[1].abilityIpfsCid, TOOL_IPFS_CID_2);
        assertEq(apps[0].versions[1].abilities[1].policyIpfsCids.length, 0);

        assertEq(apps[0].versions[1].abilities[2].abilityIpfsCid, TOOL_IPFS_CID_3);
        assertEq(apps[0].versions[1].abilities[2].policyIpfsCids.length, 3);
        assertEq(apps[0].versions[1].abilities[2].policyIpfsCids[0], POLICY_IPFS_CID_1);
        assertEq(apps[0].versions[1].abilities[2].policyIpfsCids[1], POLICY_IPFS_CID_2);
        assertEq(apps[0].versions[1].abilities[2].policyIpfsCids[2], POLICY_IPFS_CID_3);

        app = vincentAppViewFacet.getAppByDelegatee(APP_DELEGATEE_CHARLIE);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
    }

    function testEnableAppVersion() public {
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.AppEnabled(newAppId, newAppVersion, false);
        vincentAppFacet.enableAppVersion(newAppId, newAppVersion, false);
        vm.stopPrank();

        VincentAppViewFacet.App memory app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        VincentAppViewFacet.AppVersion memory appVersion;
        (app, appVersion) = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
        
        assertEq(appVersion.version, newAppVersion);
        assertFalse(appVersion.enabled);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.AppEnabled(newAppId, newAppVersion, true);
        vincentAppFacet.enableAppVersion(newAppId, newAppVersion, true);
        vm.stopPrank();

        app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        (app, appVersion) = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
        
        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
    }

    function testAddAndRemoveDelegatee() public {
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.DelegateeAdded(newAppId, APP_DELEGATEE_DAVID);
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_DAVID);
        vm.stopPrank();

        VincentAppViewFacet.App memory app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 2);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
        assertEq(app.delegatees[1], APP_DELEGATEE_DAVID);

        VincentAppViewFacet.AppVersion memory appVersion;
        (app, appVersion) = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 2);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
        assertEq(app.delegatees[1], APP_DELEGATEE_DAVID);
        
        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.DelegateeRemoved(newAppId, APP_DELEGATEE_CHARLIE);
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
        vm.stopPrank();
        
        app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_DAVID);

        (app, appVersion) = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_DAVID);
        
        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
    }

    function testDeleteApp() public {
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.AppDeleted(newAppId);
        vincentAppFacet.deleteApp(newAppId);
        vm.stopPrank();

        VincentAppViewFacet.App memory app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertTrue(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        VincentAppViewFacet.AppVersion memory appVersion;
        (app, appVersion) = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertTrue(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
        
        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
    }

    /**
     * ######################### registerNextAppVersion ERROR CASES #########################
     */
    function testRegisterNextAppVersion_AppHasBeenDeleted() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        VincentAppFacet.AppVersionAbilities memory versionAbilities_newAppVersion;
        vincentAppFacet.registerNextAppVersion(newAppId, versionAbilities_newAppVersion);
    }

    function testRegisterNextAppVersion_NotAppManager() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE));

        VincentAppFacet.AppVersionAbilities memory versionAbilities_newAppVersion;
        vincentAppFacet.registerNextAppVersion(newAppId, versionAbilities_newAppVersion);
    }

    /**
     * @dev This error case should revert with VincentBase.AppNotRegistered, but it doesn't
     *      because we first check if msg.sender is the App Manager
     *      and a non-existing App ID will address(0) for the App Manager.
     */
    function testRegisterNextAppVersion_AppNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, 1, address(this)));

        VincentAppFacet.AppVersionAbilities memory versionAbilities_newAppVersion;
        vincentAppFacet.registerNextAppVersion(1, versionAbilities_newAppVersion);
    }

    /**
     * ######################### enableAppVersion ERROR CASES #########################
     */
    function testEnableAppVersion_AppHasBeenDeleted() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        vincentAppFacet.enableAppVersion(newAppId, newAppId, false);
    }

    function testEnableAppVersion_NotAppManager() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE));

        vincentAppFacet.enableAppVersion(newAppId, newAppId, false);
    }

    /**
     * @dev This error case should revert with VincentBase.AppNotRegistered, but it doesn't
     *      because we first check if msg.sender is the App Manager
     *      and a non-existing App ID will address(0) for the App Manager.
     */
    function testEnableAppVersion_AppNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, 1, address(this)));
        vincentAppFacet.enableAppVersion(1, 1, false);
    }

    function testEnableAppVersion_AppVersionAlreadyInRequestedState() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.AppVersionAlreadyInRequestedState.selector, newAppId, newAppId, true));

        vincentAppFacet.enableAppVersion(newAppId, newAppId, true);
    }

    /**
     * ######################### addDelegatee ERROR CASES #########################
     */
    function testAddDelegatee_AppHasBeenDeleted() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    function testAddDelegatee_NotAppManager() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE));
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    /**
     * @dev This error case should revert with VincentBase.AppNotRegistered, but it doesn't
     *      because we first check if msg.sender is the App Manager
     *      and a non-existing App ID will address(0) for the App Manager.
     */
    function testAddDelegatee_AppNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, 1, address(this)));
        vincentAppFacet.addDelegatee(1, APP_DELEGATEE_DAVID);
    }

    function testAddDelegatee_ZeroAddressDelegatee() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(LibVincentAppFacet.ZeroAddressDelegateeNotAllowed.selector);
        vincentAppFacet.addDelegatee(newAppId, address(0));
    }

    function testAddDelegatee_DelegateeAlreadyRegistered() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.DelegateeAlreadyRegisteredToApp.selector, newAppId, APP_DELEGATEE_CHARLIE));
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    /**
     * ######################### removeDelegatee ERROR CASES #########################
     */
    function testRemoveDelegatee_AppHasBeenDeleted() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    function testRemoveDelegatee_NotAppManager() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE));
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    /**
     * @dev This error case should revert with VincentBase.AppNotRegistered, but it doesn't
     *      because we first check if msg.sender is the App Manager
     *      and a non-existing App ID will address(0) for the App Manager.
     */
    function testRemoveDelegatee_AppNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, 1, address(this)));
        vincentAppFacet.removeDelegatee(1, APP_DELEGATEE_CHARLIE);
    }

    function testRemoveDelegatee_DelegateeNotRegistered() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.DelegateeNotRegisteredToApp.selector, newAppId, APP_DELEGATEE_DAVID));
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    /**
     * ######################### deleteApp ERROR CASES #########################
     */
    function testDeleteApp_AppHasBeenDeleted() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.deleteApp(newAppId);
    }

    function testDeleteApp_NotAppManager() public {
        uint256 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE));
        vincentAppFacet.deleteApp(newAppId);
    }

    /**
     * @dev This error case should revert with VincentBase.AppNotRegistered, but it doesn't
     *      because we first check if msg.sender is the App Manager
     *      and a non-existing App ID will address(0) for the App Manager.
     */
    function testDeleteApp_AppNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, 1, address(this)));
        vincentAppFacet.deleteApp(1);
    }

    function testDeleteApp_AppVersionHasDelegatedAgents() public {
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId);

        // Create arrays for all registered abilities
        string[] memory abilityIpfsCids = new string[](2);
        abilityIpfsCids[0] = TOOL_IPFS_CID_1;
        abilityIpfsCids[1] = TOOL_IPFS_CID_2;

        string[][] memory policyIpfsCids = new string[][](2);
        policyIpfsCids[0] = new string[](1);
        policyIpfsCids[0][0] = POLICY_IPFS_CID_1;
        policyIpfsCids[1] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](2);
        policyParameterValues[0] = new bytes[](1);
        policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        policyParameterValues[1] = new bytes[](0);

        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.AppDeleted(newAppId);
        vincentAppFacet.deleteApp(newAppId);

        assertEq(vincentAppViewFacet.getAppById(newAppId).isDeleted, true);
    }

    function test_fetchDelegatedAgentPkpTokenIds() public {
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId);

        // Create arrays for all registered abilities
        string[] memory abilityIpfsCids = new string[](2);
        abilityIpfsCids[0] = TOOL_IPFS_CID_1;
        abilityIpfsCids[1] = TOOL_IPFS_CID_2;

        string[][] memory policyIpfsCids = new string[][](2);
        policyIpfsCids[0] = new string[](1);
        policyIpfsCids[0][0] = POLICY_IPFS_CID_1;
        policyIpfsCids[1] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](2);
        policyParameterValues[0] = new bytes[](1);
        policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        policyParameterValues[1] = new bytes[](0);

        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        uint256[] memory delegatedAgentPkpTokenIds = vincentAppViewFacet.getDelegatedAgentPkpTokenIds(newAppId, newAppVersion, 0, 1);
        assertEq(delegatedAgentPkpTokenIds.length, 1);
        assertEq(delegatedAgentPkpTokenIds[0], PKP_TOKEN_ID_1);

        vm.expectRevert(abi.encodeWithSelector(VincentAppViewFacet.InvalidOffsetOrLimit.selector));
        vincentAppViewFacet.getDelegatedAgentPkpTokenIds(newAppId, newAppVersion, 1, 1);

        vm.expectRevert(abi.encodeWithSelector(VincentAppViewFacet.InvalidOffsetOrLimit.selector));
        vincentAppViewFacet.getDelegatedAgentPkpTokenIds(newAppId, newAppVersion, 0, 2);

        vm.expectRevert(abi.encodeWithSelector(VincentAppViewFacet.InvalidOffsetOrLimit.selector));
        vincentAppViewFacet.getDelegatedAgentPkpTokenIds(newAppId, newAppVersion, 1, 0);
    }

    function _registerApp(
        uint256 appId,
        address[] memory delegatees,
        VincentAppFacet.AppVersionAbilities memory versionAbilities
    ) private returns (uint256) {
        vm.startPrank(APP_MANAGER_ALICE);
        uint256 newAppVersion = vincentAppFacet.registerApp(appId, delegatees, versionAbilities);
        vm.stopPrank();

        return newAppVersion;
    }

    function _registerBasicApp(uint256 appId) private returns (uint256 newAppVersion) {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;

        VincentAppFacet.AppVersionAbilities memory versionAbilities;
        versionAbilities.abilityIpfsCids = new string[](2);

        versionAbilities.abilityIpfsCids[0] = TOOL_IPFS_CID_1;
        versionAbilities.abilityIpfsCids[1] = TOOL_IPFS_CID_2;

        versionAbilities.abilityPolicies = new string[][](2);

        versionAbilities.abilityPolicies[0] = new string[](1);
        versionAbilities.abilityPolicies[0][0] = POLICY_IPFS_CID_1;

        versionAbilities.abilityPolicies[1] = new string[](0);

        newAppVersion = _registerApp(appId, delegatees, versionAbilities);

        assertEq(newAppVersion, 1);
    }
}
