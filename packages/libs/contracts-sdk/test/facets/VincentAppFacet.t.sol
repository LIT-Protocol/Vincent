// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";

import {VincentDiamond} from "../../contracts/VincentDiamond.sol";
import {VincentAppFacet} from "../../contracts/facets/VincentAppFacet.sol";
import {VincentAppViewFacet} from "../../contracts/facets/VincentAppViewFacet.sol";
import {VincentUserFacet} from "../../contracts/facets/VincentUserFacet.sol";
import {VincentUserViewFacet} from "../../contracts/facets/VincentUserViewFacet.sol";

import {LibVincentAppFacet} from "../../contracts/libs/LibVincentAppFacet.sol";
import {VincentBase} from "../../contracts/VincentBase.sol";
import {TestCommon} from "../TestCommon.sol";

contract VincentAppFacetTest is TestCommon {
    string constant ABILITY_IPFS_CID_1 = "QmAbility1";
    string constant ABILITY_IPFS_CID_2 = "QmAbility2";
    string constant ABILITY_IPFS_CID_3 = "QmAbility3";

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

    address USER_FRANK = makeAddr("Frank");
    address USER_GEORGE = makeAddr("George");

    address APP_USER_FRANK = makeAddr("Frank_App_Account");
    address APP_USER_GEORGE = makeAddr("George_App_Account");

    address FRANK_PKP_SIGNER = makeAddr("FrankPkpSigner");
    address GEORGE_PKP_SIGNER = makeAddr("GeorgePkpSigner");

    bytes constant FRANK_PKP_SIGNER_PUB_KEY = hex"0255b1d15a6ed11596e193d74788812e751ec8fdc30e02f194d4c86bd30e0e5e7b";
    bytes constant GEORGE_PKP_SIGNER_PUB_KEY = hex"02ee8087951fe615e7c2510c2533ab3ad013376a684150734ff4359bc22a94df0b";

    VincentDiamond public vincentDiamond;
    VincentAppFacet public vincentAppFacet;
    VincentAppViewFacet public vincentAppViewFacet;
    VincentUserFacet public vincentUserFacet;
    VincentUserViewFacet public vincentUserViewFacet;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));

        DeployVincentDiamond deployScript = new DeployVincentDiamond();

        address diamondAddress = deployScript.deployToNetwork("test", keccak256("VincentCreate2Salt_2"));
        vincentDiamond = VincentDiamond(payable(diamondAddress));

        vincentAppFacet = VincentAppFacet(diamondAddress);
        vincentAppViewFacet = VincentAppViewFacet(diamondAddress);
        vincentUserFacet = VincentUserFacet(diamondAddress);
        vincentUserViewFacet = VincentUserViewFacet(diamondAddress);
    }

    function testRegisterApp() public {
        uint40 expectedAppId = 1;
        bytes32 expectedAccountIndexHash = keccak256(abi.encodePacked("vincent_app_id_", expectedAppId));

        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewAppRegistered(expectedAppId, expectedAccountIndexHash, APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewLitActionRegistered(keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)));
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewLitActionRegistered(keccak256(abi.encodePacked(ABILITY_IPFS_CID_2)));
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewAppVersionRegistered(expectedAppId, 1, APP_MANAGER_ALICE);

        (uint40 newAppId, uint24 newAppVersion, bytes32 accountIndexHash) = _registerBasicApp();

        assertEq(newAppId, expectedAppId);
        assertEq(newAppVersion, 1);
        assertEq(accountIndexHash, expectedAccountIndexHash);

        VincentAppViewFacet.App memory app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
        assertEq(app.accountIndexHash, accountIndexHash);

        VincentAppViewFacet.AppVersion memory appVersion;
        appVersion = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);

        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
        assertEq(appVersion.delegatedAgents.length, 0);
        assertEq(appVersion.abilities.length, 2);

        assertEq(appVersion.abilities[0].abilityIpfsCid, ABILITY_IPFS_CID_1);
        assertEq(appVersion.abilities[0].policyIpfsCids.length, 1);
        assertEq(appVersion.abilities[0].policyIpfsCids[0], POLICY_IPFS_CID_1);

        assertEq(appVersion.abilities[1].abilityIpfsCid, ABILITY_IPFS_CID_2);
        assertEq(appVersion.abilities[1].policyIpfsCids.length, 0);

        (uint40[] memory appIds, uint24[] memory appVersionCounts) =
            vincentAppViewFacet.getAppsByManager(APP_MANAGER_ALICE, 0);
        assertEq(appIds.length, 1);
        assertEq(appIds[0], newAppId);
        assertEq(appVersionCounts.length, 1);
        assertEq(appVersionCounts[0], newAppVersion);

        /**
         * Now testing registering the next version of the app
         */
        VincentAppFacet.AppVersionAbilities memory versionAbilities_newAppVersion;
        versionAbilities_newAppVersion.abilityIpfsCids = new string[](3);

        versionAbilities_newAppVersion.abilityIpfsCids[0] = ABILITY_IPFS_CID_1;
        versionAbilities_newAppVersion.abilityIpfsCids[1] = ABILITY_IPFS_CID_2;
        versionAbilities_newAppVersion.abilityIpfsCids[2] = ABILITY_IPFS_CID_3;

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

        appVersion = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
        assertEq(appVersion.delegatedAgents.length, 0);
        assertEq(appVersion.abilities.length, 3);

        assertEq(appVersion.abilities[0].abilityIpfsCid, ABILITY_IPFS_CID_1);
        assertEq(appVersion.abilities[0].policyIpfsCids.length, 1);
        assertEq(appVersion.abilities[0].policyIpfsCids[0], POLICY_IPFS_CID_1);

        assertEq(appVersion.abilities[1].abilityIpfsCid, ABILITY_IPFS_CID_2);
        assertEq(appVersion.abilities[1].policyIpfsCids.length, 0);

        assertEq(appVersion.abilities[2].abilityIpfsCid, ABILITY_IPFS_CID_3);
        assertEq(appVersion.abilities[2].policyIpfsCids.length, 3);
        assertEq(appVersion.abilities[2].policyIpfsCids[0], POLICY_IPFS_CID_1);
        assertEq(appVersion.abilities[2].policyIpfsCids[1], POLICY_IPFS_CID_2);
        assertEq(appVersion.abilities[2].policyIpfsCids[2], POLICY_IPFS_CID_3);

        (appIds, appVersionCounts) = vincentAppViewFacet.getAppsByManager(APP_MANAGER_ALICE, 0);
        assertEq(appIds.length, 1);
        assertEq(appIds[0], newAppId);
        assertEq(appVersionCounts.length, 1);
        assertEq(appVersionCounts[0], newAppVersion);

        (appIds, appVersionCounts) = vincentAppViewFacet.getAppsByManager(APP_MANAGER_ALICE, 0);
        assertEq(appIds.length, 1);
        assertEq(appIds[0], newAppId);
        assertEq(appVersionCounts.length, 1);
        assertEq(appVersionCounts[0], newAppVersion);

        app = vincentAppViewFacet.getAppByDelegatee(APP_DELEGATEE_CHARLIE);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);
    }

    function testEnableAppVersion() public {
        (uint40 newAppId, uint24 newAppVersion,) = _registerBasicApp();

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
        appVersion = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
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

        appVersion = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
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
        (uint40 newAppId, uint24 newAppVersion,) = _registerBasicApp();

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
        appVersion = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
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

        appVersion = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
        assertEq(app.id, newAppId);
        assertFalse(app.isDeleted);
        assertEq(app.manager, APP_MANAGER_ALICE);
        assertEq(app.latestVersion, newAppVersion);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_DAVID);

        assertEq(appVersion.version, newAppVersion);
        assertTrue(appVersion.enabled);
    }

    function testSetDelegatee() public {
        (uint40 newAppId,,) = _registerBasicApp();

        VincentAppViewFacet.App memory app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        vm.startPrank(APP_MANAGER_ALICE);

        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.DelegateeRemoved(newAppId, APP_DELEGATEE_CHARLIE);

        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.DelegateeAdded(newAppId, APP_DELEGATEE_EVE);

        address[] memory newDelegatees = new address[](1);
        newDelegatees[0] = APP_DELEGATEE_EVE;
        vincentAppFacet.setDelegatee(newAppId, newDelegatees);
        vm.stopPrank();

        app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_EVE);
    }

    function testSetDelegatee_RemoveAllDelegatees() public {
        (uint40 newAppId,,) = _registerBasicApp();

        VincentAppViewFacet.App memory app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.delegatees.length, 1);
        assertEq(app.delegatees[0], APP_DELEGATEE_CHARLIE);

        vm.startPrank(APP_MANAGER_ALICE);

        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.DelegateeRemoved(newAppId, APP_DELEGATEE_CHARLIE);

        address[] memory emptyDelegatees = new address[](0);
        vincentAppFacet.setDelegatee(newAppId, emptyDelegatees);
        vm.stopPrank();

        // Verify that no delegatees remain
        app = vincentAppViewFacet.getAppById(newAppId);
        assertEq(app.delegatees.length, 0);
    }

    function testDeleteApp() public {
        (uint40 newAppId, uint24 newAppVersion,) = _registerBasicApp();

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
        appVersion = vincentAppViewFacet.getAppVersion(newAppId, newAppVersion);
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
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        VincentAppFacet.AppVersionAbilities memory versionAbilities_newAppVersion;
        vincentAppFacet.registerNextAppVersion(newAppId, versionAbilities_newAppVersion);
    }

    function testRegisterNextAppVersion_NotAppManager() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE)
        );

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
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        vincentAppFacet.enableAppVersion(newAppId, 1, false);
    }

    function testEnableAppVersion_NotAppManager() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE)
        );

        vincentAppFacet.enableAppVersion(newAppId, 1, false);
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
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentAppFacet.AppVersionAlreadyInRequestedState.selector, newAppId, 1, true)
        );

        vincentAppFacet.enableAppVersion(newAppId, 1, true);
    }

    /**
     * ######################### addDelegatee ERROR CASES #########################
     */
    function testAddDelegatee_AppHasBeenDeleted() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    function testAddDelegatee_NotAppManager() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE)
        );
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
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(LibVincentAppFacet.ZeroAddressDelegateeNotAllowed.selector);
        vincentAppFacet.addDelegatee(newAppId, address(0));
    }

    function testAddDelegatee_DelegateeAlreadyRegistered() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentAppFacet.DelegateeAlreadyRegisteredToApp.selector, newAppId, APP_DELEGATEE_CHARLIE
            )
        );
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    function testSetDelegatee_DelegateeAlreadyRegistered() public {
        // Create first app with Charlie
        (uint40 appId1,,) = _registerBasicApp();

        // Create second app with David
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_DAVID;
        (uint40 appId2,,) = _registerApp(
            delegatees, _createBasicVersionAbilities(ABILITY_IPFS_CID_1, ABILITY_IPFS_CID_2, POLICY_IPFS_CID_1)
        );

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentAppFacet.DelegateeAlreadyRegisteredToApp.selector, appId1, APP_DELEGATEE_CHARLIE
            )
        );

        // Try to add Charlie (from app1) to app2
        address[] memory newDelegatees = new address[](1);
        newDelegatees[0] = APP_DELEGATEE_CHARLIE;
        vincentAppFacet.setDelegatee(appId2, newDelegatees);
        vm.stopPrank();
    }

    /**
     * ######################### removeDelegatee ERROR CASES #########################
     */
    function testRemoveDelegatee_AppHasBeenDeleted() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    function testRemoveDelegatee_NotAppManager() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE)
        );
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
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentAppFacet.DelegateeNotRegisteredToApp.selector, newAppId, APP_DELEGATEE_DAVID
            )
        );
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    /**
     * ######################### deleteApp ERROR CASES #########################
     */
    function testDeleteApp_AppHasBeenDeleted() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.deleteApp(newAppId);
    }

    function testDeleteApp_NotAppManager() public {
        (uint40 newAppId,,) = _registerBasicApp();

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE)
        );
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
        (uint40 newAppId, uint24 newAppVersion,) = _registerBasicApp();

        // Create arrays for all registered abilities
        string[] memory abilityIpfsCids = new string[](2);
        abilityIpfsCids[0] = ABILITY_IPFS_CID_1;
        abilityIpfsCids[1] = ABILITY_IPFS_CID_2;

        string[][] memory policyIpfsCids = new string[][](2);
        policyIpfsCids[0] = new string[](1);
        policyIpfsCids[0][0] = POLICY_IPFS_CID_1;
        policyIpfsCids[1] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](2);
        policyParameterValues[0] = new bytes[](1);
        policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        policyParameterValues[1] = new bytes[](0);

        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            APP_USER_FRANK,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Verify app is permitted before deletion
        address[] memory agentAddresses = new address[](1);
        agentAddresses[0] = APP_USER_FRANK;
        VincentUserViewFacet.AgentPermittedApp[] memory permittedAppResults =
            vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedAppResults.length, 1);
        assertEq(permittedAppResults[0].agentAddress, APP_USER_FRANK);
        assertEq(permittedAppResults[0].permittedApp.appId, newAppId);
        assertEq(permittedAppResults[0].permittedApp.version, newAppVersion);
        assertTrue(permittedAppResults[0].permittedApp.versionEnabled);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.AppDeleted(newAppId);
        vincentAppFacet.deleteApp(newAppId);

        assertEq(vincentAppViewFacet.getAppById(newAppId).isDeleted, true);

        // Verify deleted app is still returned but with isDeleted flag set to true
        permittedAppResults = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedAppResults.length, 1);
        assertEq(permittedAppResults[0].agentAddress, APP_USER_FRANK);
        assertEq(permittedAppResults[0].permittedApp.appId, newAppId);
        assertEq(permittedAppResults[0].permittedApp.version, newAppVersion);
        assertTrue(permittedAppResults[0].permittedApp.isDeleted); // isDeleted flag should be true
    }

    function test_fetchDelegatedAgentAddresses() public {
        (uint40 newAppId, uint24 newAppVersion,) = _registerBasicApp();

        // Create arrays for all registered abilities
        string[] memory abilityIpfsCids = new string[](2);
        abilityIpfsCids[0] = ABILITY_IPFS_CID_1;
        abilityIpfsCids[1] = ABILITY_IPFS_CID_2;

        string[][] memory policyIpfsCids = new string[][](2);
        policyIpfsCids[0] = new string[](1);
        policyIpfsCids[0][0] = POLICY_IPFS_CID_1;
        policyIpfsCids[1] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](2);
        policyParameterValues[0] = new bytes[](1);
        policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        policyParameterValues[1] = new bytes[](0);

        // Permit app for Frank
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            APP_USER_FRANK,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Permit app for George
        vm.startPrank(USER_GEORGE);
        vincentUserFacet.permitAppVersion(
            APP_USER_GEORGE,
            GEORGE_PKP_SIGNER,
            GEORGE_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Fetch all delegated agents (offset 0) - should return both agents
        address[] memory delegatedAgentAddresses =
            vincentAppViewFacet.getDelegatedAgentAddresses(newAppId, newAppVersion, 0);
        assertEq(delegatedAgentAddresses.length, 2);
        assertEq(delegatedAgentAddresses[0], APP_USER_FRANK);
        assertEq(delegatedAgentAddresses[1], APP_USER_GEORGE);

        // Verify the reverse mapping: agent address -> user address
        address userAddressForFrank = vincentUserViewFacet.getUserAddressForAgent(APP_USER_FRANK);
        assertEq(userAddressForFrank, USER_FRANK, "Frank's agent should map to Frank's user address");

        address userAddressForGeorge = vincentUserViewFacet.getUserAddressForAgent(APP_USER_GEORGE);
        assertEq(userAddressForGeorge, USER_GEORGE, "George's agent should map to George's user address");

        // Fetch with offset 1 - should return only the second agent
        delegatedAgentAddresses = vincentAppViewFacet.getDelegatedAgentAddresses(newAppId, newAppVersion, 1);
        assertEq(delegatedAgentAddresses.length, 1);
        assertEq(delegatedAgentAddresses[0], APP_USER_GEORGE);

        // Verify that offset 2 reverts (exceeds available agents)
        vm.expectRevert(abi.encodeWithSelector(VincentBase.InvalidOffset.selector, 2, 2));
        vincentAppViewFacet.getDelegatedAgentAddresses(newAppId, newAppVersion, 2);
    }

    function _registerApp(
        address[] memory delegatees,
        VincentAppFacet.AppVersionAbilities memory versionAbilities
    ) private returns (uint40 newAppId, uint24 newAppVersion, bytes32 accountIndexHash) {
        vm.startPrank(APP_MANAGER_ALICE);
        (newAppId, newAppVersion, accountIndexHash) = vincentAppFacet.registerApp(delegatees, versionAbilities);
        vm.stopPrank();
    }

    function _registerBasicApp() private returns (uint40 newAppId, uint24 newAppVersion, bytes32 accountIndexHash) {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;

        (newAppId, newAppVersion, accountIndexHash) = _registerApp(
            delegatees, _createBasicVersionAbilities(ABILITY_IPFS_CID_1, ABILITY_IPFS_CID_2, POLICY_IPFS_CID_1)
        );
    }
}
