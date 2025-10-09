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
        emit LibVincentAppFacet.NewLitActionRegistered(keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)));
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewLitActionRegistered(keccak256(abi.encodePacked(ABILITY_IPFS_CID_2)));
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.NewAppVersionRegistered(1, 1, APP_MANAGER_ALICE);

        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(newAppId);

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
        assertTrue(appVersion.enabled);
        assertEq(appVersion.delegatedAgentPkpTokenIds.length, 0);
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
        assertEq(appVersion.delegatedAgentPkpTokenIds.length, 0);
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        VincentAppFacet.AppVersionAbilities memory versionAbilities_newAppVersion;
        vincentAppFacet.registerNextAppVersion(newAppId, versionAbilities_newAppVersion);
    }

    function testRegisterNextAppVersion_NotAppManager() public {
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        vincentAppFacet.enableAppVersion(newAppId, 1, false);
    }

    function testEnableAppVersion_NotAppManager() public {
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    function testAddDelegatee_NotAppManager() public {
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(LibVincentAppFacet.ZeroAddressDelegateeNotAllowed.selector);
        vincentAppFacet.addDelegatee(newAppId, address(0));
    }

    function testAddDelegatee_DelegateeAlreadyRegistered() public {
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 appId1 = 1;
        _registerBasicApp(appId1);

        // Create second app with David
        uint40 appId2 = 2;
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_DAVID;
        _registerApp(appId2, delegatees, _createBasicVersionAbilities());

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    function testRemoveDelegatee_NotAppManager() public {
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.deleteApp(newAppId);
    }

    function testDeleteApp_NotAppManager() public {
        uint40 newAppId = 1;
        _registerBasicApp(newAppId);

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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(newAppId);

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

        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1, newAppId, newAppVersion, abilityIpfsCids, policyIpfsCids, policyParameterValues
        );
        vm.stopPrank();

        // Verify app is permitted before deletion
        uint256[] memory pkpTokenIds = new uint256[](1);
        pkpTokenIds[0] = PKP_TOKEN_ID_1;
        VincentUserViewFacet.PkpPermittedApps[] memory permittedAppsResults =
            vincentUserViewFacet.getPermittedAppsForPkps(pkpTokenIds, 0, 10);
        assertEq(permittedAppsResults.length, 1);
        assertEq(permittedAppsResults[0].permittedApps.length, 1);
        assertEq(permittedAppsResults[0].pkpTokenId, PKP_TOKEN_ID_1);
        assertEq(permittedAppsResults[0].permittedApps[0].appId, newAppId);
        assertEq(permittedAppsResults[0].permittedApps[0].version, newAppVersion);
        assertTrue(permittedAppsResults[0].permittedApps[0].versionEnabled);

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectEmit(true, true, true, true);
        emit LibVincentAppFacet.AppDeleted(newAppId);
        vincentAppFacet.deleteApp(newAppId);

        assertEq(vincentAppViewFacet.getAppById(newAppId).isDeleted, true);

        // Verify deleted app is still returned but with isDeleted flag set to true
        permittedAppsResults = vincentUserViewFacet.getPermittedAppsForPkps(pkpTokenIds, 0, 10);
        assertEq(permittedAppsResults.length, 1);
        assertEq(permittedAppsResults[0].pkpTokenId, PKP_TOKEN_ID_1);
        assertEq(permittedAppsResults[0].permittedApps.length, 1); // Deleted app should still appear
        assertEq(permittedAppsResults[0].permittedApps[0].appId, newAppId);
        assertTrue(permittedAppsResults[0].permittedApps[0].isDeleted); // isDeleted flag should be true

        // Verify permitted app version is still returned even if the app has been deleted
        uint24 permittedAppVersion = vincentUserViewFacet.getPermittedAppVersionForPkp(PKP_TOKEN_ID_1, newAppId);
        assertEq(permittedAppVersion, newAppVersion);
    }

    function test_fetchDelegatedAgentPkpTokenIds() public {
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(newAppId);

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

        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1, newAppId, newAppVersion, abilityIpfsCids, policyIpfsCids, policyParameterValues
        );
        vm.stopPrank();

        uint256[] memory delegatedAgentPkpTokenIds =
            vincentAppViewFacet.getDelegatedAgentPkpTokenIds(newAppId, newAppVersion, 0);
        assertEq(delegatedAgentPkpTokenIds.length, 1);
        assertEq(delegatedAgentPkpTokenIds[0], PKP_TOKEN_ID_1);

        vm.expectRevert(abi.encodeWithSelector(VincentBase.InvalidOffset.selector, 1, 1));
        vincentAppViewFacet.getDelegatedAgentPkpTokenIds(newAppId, newAppVersion, 1);
    }

    function _registerApp(
        uint40 appId,
        address[] memory delegatees,
        VincentAppFacet.AppVersionAbilities memory versionAbilities
    ) private returns (uint24) {
        vm.startPrank(APP_MANAGER_ALICE);
        uint24 newAppVersion = vincentAppFacet.registerApp(appId, delegatees, versionAbilities);
        vm.stopPrank();

        return newAppVersion;
    }

    function _registerBasicApp(uint40 appId) private returns (uint24 newAppVersion) {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;

        newAppVersion = _registerApp(appId, delegatees, _createBasicVersionAbilities());
        assertEq(newAppVersion, 1);
    }

    function _createBasicVersionAbilities() private pure returns (VincentAppFacet.AppVersionAbilities memory) {
        VincentAppFacet.AppVersionAbilities memory versionAbilities;
        versionAbilities.abilityIpfsCids = new string[](2);

        versionAbilities.abilityIpfsCids[0] = ABILITY_IPFS_CID_1;
        versionAbilities.abilityIpfsCids[1] = ABILITY_IPFS_CID_2;

        versionAbilities.abilityPolicies = new string[][](2);

        versionAbilities.abilityPolicies[0] = new string[](1);
        versionAbilities.abilityPolicies[0][0] = POLICY_IPFS_CID_1;

        versionAbilities.abilityPolicies[1] = new string[](0);

        return versionAbilities;
    }
}
