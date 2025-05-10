// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployVincentDiamond} from "../../../script/DeployVincentDiamond.sol";
import {MockPKPNftFacet} from "../../mocks/MockPKPNftFacet.sol";

import {VincentDiamond} from "../../../src/VincentDiamond.sol";
import {VincentAppFacet} from "../../../src/facets/VincentAppFacet.sol";
import {VincentAppViewFacet} from "../../../src/facets/VincentAppViewFacet.sol";
import {VincentUserFacet} from "../../../src/facets/VincentUserFacet.sol";
import {VincentUserViewFacet} from "../../../src/facets/VincentUserViewFacet.sol";

import {LibVincentAppFacet} from "../../../src/libs/LibVincentAppFacet.sol";
import {VincentBase} from "../../../src/VincentBase.sol";

contract VincentAppFacetTest is Test {
    uint256 constant PKP_TOKEN_ID_1 = 1;
    uint256 constant PKP_TOKEN_ID_2 = 2;

    string constant TOOL_IPFS_CID_1 = "QmTool1";
    string constant TOOL_IPFS_CID_2 = "QmTool2";
    string constant TOOL_IPFS_CID_3 = "QmTool3";

    string constant POLICY_IPFS_CID_1 = "QmPolicy1";
    string constant POLICY_IPFS_CID_2 = "QmPolicy2";
    string constant POLICY_IPFS_CID_3 = "QmPolicy3";

    bytes constant POLICY_PARAMETER_METADATA_1 = abi.encode(1);
    bytes constant POLICY_PARAMETER_METADATA_2 = abi.encode(2);
    bytes constant POLICY_PARAMETER_METADATA_3 = abi.encode(3);

    bytes constant POLICY_PARAMETER_VALUES_1 = abi.encode(1);
    bytes constant POLICY_PARAMETER_VALUES_2 = abi.encode(2);
    bytes constant POLICY_PARAMETER_VALUES_3 = abi.encode(3);

    address APP_MANAGER_ALICE = makeAddr("Alice");
    address APP_MANAGER_BOB = makeAddr("Bob");

    address APP_DELEGATEE_CHARLIE = makeAddr("Charlie");
    address APP_DELEGATEE_DAVID = makeAddr("David");

    address APP_USER_EVE = makeAddr("Eve");
    address APP_USER_FRANK = makeAddr("Frank");

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

        mockPkpNft.setOwner(PKP_TOKEN_ID_1, APP_USER_EVE);
        mockPkpNft.setOwner(PKP_TOKEN_ID_2, APP_USER_FRANK);

        vincentAppFacet = VincentAppFacet(diamondAddress);
        vincentAppViewFacet = VincentAppViewFacet(diamondAddress);
        vincentUserFacet = VincentUserFacet(diamondAddress);
        vincentUserViewFacet = VincentUserViewFacet(diamondAddress);
    }

    function testRegisterApp() public {
        (uint256 newAppId, uint256 newAppVersion) = _registerBasicApp();

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
        assertEq(appVersion.tools.length, 2);

        assertEq(appVersion.tools[0].toolIpfsCid, TOOL_IPFS_CID_1);
        assertEq(appVersion.tools[0].policies.length, 1);
        assertEq(appVersion.tools[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);

        assertEq(appVersion.tools[1].toolIpfsCid, TOOL_IPFS_CID_2);
        assertEq(appVersion.tools[1].policies.length, 0);

        /**
         * Now testing registering the next version of the app
         */

        VincentAppFacet.AppVersionTools memory versionTools_newAppVersion;
        versionTools_newAppVersion.toolIpfsCids = new string[](3);

        versionTools_newAppVersion.toolIpfsCids[0] = TOOL_IPFS_CID_1;
        versionTools_newAppVersion.toolIpfsCids[1] = TOOL_IPFS_CID_2;
        versionTools_newAppVersion.toolIpfsCids[2] = TOOL_IPFS_CID_3;

        versionTools_newAppVersion.toolPolicies = new string[][](3);

        versionTools_newAppVersion.toolPolicies[0] = new string[](1);
        versionTools_newAppVersion.toolPolicies[0][0] = POLICY_IPFS_CID_1;

        versionTools_newAppVersion.toolPolicies[1] = new string[](0);

        versionTools_newAppVersion.toolPolicies[2] = new string[](3);
        versionTools_newAppVersion.toolPolicies[2][0] = POLICY_IPFS_CID_1;
        versionTools_newAppVersion.toolPolicies[2][1] = POLICY_IPFS_CID_2;
        versionTools_newAppVersion.toolPolicies[2][2] = POLICY_IPFS_CID_3;

        versionTools_newAppVersion.toolPolicyParameterMetadata = new bytes[][](3);

        versionTools_newAppVersion.toolPolicyParameterMetadata[0] = new bytes[](1);
        versionTools_newAppVersion.toolPolicyParameterMetadata[0][0] = POLICY_PARAMETER_METADATA_1;

        versionTools_newAppVersion.toolPolicyParameterMetadata[1] = new bytes[](0);

        versionTools_newAppVersion.toolPolicyParameterMetadata[2] = new bytes[](3);
        versionTools_newAppVersion.toolPolicyParameterMetadata[2][0] = POLICY_PARAMETER_METADATA_1;
        versionTools_newAppVersion.toolPolicyParameterMetadata[2][1] = POLICY_PARAMETER_METADATA_2;
        versionTools_newAppVersion.toolPolicyParameterMetadata[2][2] = POLICY_PARAMETER_METADATA_3;

        vm.startPrank(APP_MANAGER_ALICE);
        (newAppVersion) = vincentAppFacet.registerNextAppVersion(newAppId, versionTools_newAppVersion);
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
        assertEq(appVersion.tools.length, 3);

        assertEq(appVersion.tools[0].toolIpfsCid, TOOL_IPFS_CID_1);
        assertEq(appVersion.tools[0].policies.length, 1);
        assertEq(appVersion.tools[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);

        assertEq(appVersion.tools[1].toolIpfsCid, TOOL_IPFS_CID_2);
        assertEq(appVersion.tools[1].policies.length, 0);

        assertEq(appVersion.tools[2].toolIpfsCid, TOOL_IPFS_CID_3);
        assertEq(appVersion.tools[2].policies.length, 3);
        assertEq(appVersion.tools[2].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(appVersion.tools[2].policies[1].policyIpfsCid, POLICY_IPFS_CID_2);
        assertEq(appVersion.tools[2].policies[2].policyIpfsCid, POLICY_IPFS_CID_3);

        assertEq(appVersion.tools[2].policies[0].parameterMetadata, POLICY_PARAMETER_METADATA_1);
        assertEq(appVersion.tools[2].policies[1].parameterMetadata, POLICY_PARAMETER_METADATA_2);
        assertEq(appVersion.tools[2].policies[2].parameterMetadata, POLICY_PARAMETER_METADATA_3);
    }

    function testEnableAppVersion() public {
        (uint256 newAppId, uint256 newAppVersion) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
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
        (uint256 newAppId, uint256 newAppVersion) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
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
        (uint256 newAppId, uint256 newAppVersion) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
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
        (uint256 newAppId,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        VincentAppFacet.AppVersionTools memory versionTools_newAppVersion;
        vincentAppFacet.registerNextAppVersion(newAppId, versionTools_newAppVersion);
    }

    function testRegisterNextAppVersion_NotAppManager() public {
        (uint256 newAppId,) = _registerBasicApp();

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, newAppId, APP_DELEGATEE_CHARLIE));

        VincentAppFacet.AppVersionTools memory versionTools_newAppVersion;
        vincentAppFacet.registerNextAppVersion(newAppId, versionTools_newAppVersion);
    }

    /**
     * @dev This error case should revert with VincentBase.AppNotRegistered, but it doesn't
     *      because we first check if msg.sender is the App Manager
     *      and a non-existing App ID will address(0) for the App Manager.
     */
    function testRegisterNextAppVersion_AppNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, 1, address(this)));

        VincentAppFacet.AppVersionTools memory versionTools_newAppVersion;
        vincentAppFacet.registerNextAppVersion(1, versionTools_newAppVersion);
    }

    /**
     * ######################### enableAppVersion ERROR CASES #########################
     */
    function testEnableAppVersion_AppHasBeenDeleted() public {
        (uint256 newAppId,) = _registerBasicApp();
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));

        vincentAppFacet.enableAppVersion(newAppId, newAppId, false);
    }

    function testEnableAppVersion_NotAppManager() public {
        (uint256 newAppId,) = _registerBasicApp();

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
        (uint256 newAppId,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.AppVersionAlreadyInRequestedState.selector, newAppId, newAppId, true));

        vincentAppFacet.enableAppVersion(newAppId, newAppId, true);
    }

    /**
     * ######################### addDelegatee ERROR CASES #########################
     */
    function testAddDelegatee_AppHasBeenDeleted() public {
        (uint256 newAppId,) = _registerBasicApp();
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    function testAddDelegatee_NotAppManager() public {
        (uint256 newAppId,) = _registerBasicApp();

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
        (uint256 newAppId,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(LibVincentAppFacet.ZeroAddressDelegateeNotAllowed.selector);
        vincentAppFacet.addDelegatee(newAppId, address(0));
    }

    function testAddDelegatee_DelegateeAlreadyRegistered() public {
        (uint256 newAppId,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.DelegateeAlreadyRegisteredToApp.selector, newAppId, APP_DELEGATEE_CHARLIE));
        vincentAppFacet.addDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    /**
     * ######################### removeDelegatee ERROR CASES #########################
     */
    function testRemoveDelegatee_AppHasBeenDeleted() public {
        (uint256 newAppId,) = _registerBasicApp();
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_CHARLIE);
    }

    function testRemoveDelegatee_NotAppManager() public {
        (uint256 newAppId,) = _registerBasicApp();

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
        (uint256 newAppId,) = _registerBasicApp();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.DelegateeNotRegisteredToApp.selector, newAppId, APP_DELEGATEE_DAVID));
        vincentAppFacet.removeDelegatee(newAppId, APP_DELEGATEE_DAVID);
    }

    /**
     * ######################### deleteApp ERROR CASES #########################
     */
    function testDeleteApp_AppHasBeenDeleted() public {
        (uint256 newAppId,) = _registerBasicApp();
        
        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentAppFacet.deleteApp(newAppId);
    }

    function testDeleteApp_NotAppManager() public {
        (uint256 newAppId,) = _registerBasicApp();

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
        (uint256 newAppId, uint256 newAppVersion) = _registerBasicApp();

        // Create arrays for all registered tools
        string[] memory toolIpfsCids = new string[](2);
        toolIpfsCids[0] = TOOL_IPFS_CID_1;
        toolIpfsCids[1] = TOOL_IPFS_CID_2;

        string[][] memory policyIpfsCids = new string[][](2);
        policyIpfsCids[0] = new string[](1);
        policyIpfsCids[0][0] = POLICY_IPFS_CID_1;
        policyIpfsCids[1] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](2);
        policyParameterValues[0] = new bytes[](1);
        policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        policyParameterValues[1] = new bytes[](0);

        vm.startPrank(APP_USER_EVE);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(APP_MANAGER_ALICE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.AppVersionHasDelegatedAgents.selector, newAppId, newAppVersion));
        vincentAppFacet.deleteApp(newAppId);
    }

    function _registerApp(
        address[] memory delegatees,
        VincentAppFacet.AppVersionTools memory versionTools
    ) private returns (uint256, uint256) {
        vm.startPrank(APP_MANAGER_ALICE);
        (uint256 newAppId, uint256 newAppVersion) = vincentAppFacet.registerApp(delegatees, versionTools);
        vm.stopPrank();

        return (newAppId, newAppVersion);
    }

    function _registerBasicApp() private returns (uint256 newAppId, uint256 newAppVersion) {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;

        VincentAppFacet.AppVersionTools memory versionTools;
        versionTools.toolIpfsCids = new string[](2);

        versionTools.toolIpfsCids[0] = TOOL_IPFS_CID_1;
        versionTools.toolIpfsCids[1] = TOOL_IPFS_CID_2;

        versionTools.toolPolicies = new string[][](2);

        versionTools.toolPolicies[0] = new string[](1);
        versionTools.toolPolicies[0][0] = POLICY_IPFS_CID_1;

        versionTools.toolPolicies[1] = new string[](0);

        versionTools.toolPolicyParameterMetadata = new bytes[][](2);

        versionTools.toolPolicyParameterMetadata[0] = new bytes[](1);
        versionTools.toolPolicyParameterMetadata[0][0] = POLICY_PARAMETER_METADATA_1;

        versionTools.toolPolicyParameterMetadata[1] = new bytes[](0);
        
        (newAppId, newAppVersion) = _registerApp(delegatees, versionTools);

        assertEq(newAppId, 1);
        assertEq(newAppVersion, 1);
    }
}