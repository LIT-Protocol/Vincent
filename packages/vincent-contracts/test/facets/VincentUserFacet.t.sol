// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";
import {MockPKPNftFacet} from "../mocks/MockPKPNftFacet.sol";

import {VincentDiamond} from "../../src/VincentDiamond.sol";
import {VincentAppFacet} from "../../src/facets/VincentAppFacet.sol";
import {VincentAppViewFacet} from "../../src/facets/VincentAppViewFacet.sol";
import {VincentUserFacet} from "../../src/facets/VincentUserFacet.sol";
import {VincentUserViewFacet} from "../../src/facets/VincentUserViewFacet.sol";

import {LibVincentAppFacet} from "../../src/libs/LibVincentAppFacet.sol";
import {LibVincentUserFacet} from "../../src/libs/LibVincentUserFacet.sol";
import {VincentBase} from "../../src/VincentBase.sol";

contract VincentUserFacetTest is Test {
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

    function testPermitAppVersion() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        (uint256 newAppId_1, uint256 newAppVersion_1) = _registerBasicApp(delegatees);

        delegatees[0] = APP_DELEGATEE_DAVID;
        (uint256 newAppId_2, uint256 newAppVersion_2) = _registerBasicApp(delegatees);

        delegatees[0] = APP_DELEGATEE_EVE;
        (uint256 newAppId_3, uint256 newAppVersion_3) = _registerBasicApp(delegatees);

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

        vm.startPrank(APP_USER_FRANK);
        // Expect events for first permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewUserAgentPkpRegistered(APP_USER_FRANK, PKP_TOKEN_ID_1);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId_1, newAppVersion_1);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId_1,
            newAppVersion_1,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 1 Version 1 for PKP 1 (Frank)
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId_1,
            newAppVersion_1,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Expect events for second permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId_2, newAppVersion_2);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId_2,
            newAppVersion_2,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 2 Version 1 for PKP 1 (Frank)
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId_2,
            newAppVersion_2,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(APP_USER_GEORGE);
        // Expect events for third permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewUserAgentPkpRegistered(APP_USER_GEORGE, PKP_TOKEN_ID_2);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_2, newAppId_3, newAppVersion_3);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_2,
            newAppId_3,
            newAppVersion_3,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 3 Version 1 for PKP 2 (George)
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_2,
            newAppId_3,
            newAppVersion_3,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Check that Frank has registered PKP 1
        uint256[] memory registeredAgentPkps = vincentUserViewFacet.getAllRegisteredAgentPkps(APP_USER_FRANK);
        assertEq(registeredAgentPkps.length, 1);
        assertEq(registeredAgentPkps[0], PKP_TOKEN_ID_1);

        // Check that George has registered PKP 2
        registeredAgentPkps = vincentUserViewFacet.getAllRegisteredAgentPkps(APP_USER_GEORGE);
        assertEq(registeredAgentPkps.length, 1);
        assertEq(registeredAgentPkps[0], PKP_TOKEN_ID_2);

        // Check that Frank has permitted App 1 Version 1
        uint256 permittedAppVersion = vincentUserViewFacet.getPermittedAppVersionForPkp(PKP_TOKEN_ID_1, newAppId_1);
        assertEq(permittedAppVersion, newAppVersion_1);

        // Check that Frank has permitted App 2 Version 1
        permittedAppVersion = vincentUserViewFacet.getPermittedAppVersionForPkp(PKP_TOKEN_ID_1, newAppId_2);
        assertEq(permittedAppVersion, newAppVersion_2);

        // Check that George has permitted App 3 Version 1
        permittedAppVersion = vincentUserViewFacet.getPermittedAppVersionForPkp(PKP_TOKEN_ID_2, newAppId_3);
        assertEq(permittedAppVersion, newAppVersion_3);

        // Check that Frank has permitted App 1 and App 2
        uint256[] memory permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_1);
        assertEq(permittedAppIds.length, 2);
        assertEq(permittedAppIds[0], newAppId_1);
        assertEq(permittedAppIds[1], newAppId_2);

        // Check that George has permitted App 3
        permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_2);
        assertEq(permittedAppIds.length, 1);
        assertEq(permittedAppIds[0], newAppId_3);

        // Check the Tool and Policies for App 1 Version 1 for PKP 1 (Frank)
        VincentUserViewFacet.ToolWithPolicies[] memory toolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(PKP_TOKEN_ID_1, newAppId_1);
        assertEq(toolsWithPolicies.length, 2);
        assertEq(toolsWithPolicies[0].toolIpfsCid, TOOL_IPFS_CID_1);
        assertEq(toolsWithPolicies[0].policies.length, 1);
        assertEq(toolsWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(toolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        assertEq(toolsWithPolicies[1].toolIpfsCid, TOOL_IPFS_CID_2);
        assertEq(toolsWithPolicies[1].policies.length, 0);

        // Check the Tool and Policies for App 2 Version 1 for PKP 1 (Frank)
        toolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(PKP_TOKEN_ID_1, newAppId_2);
        assertEq(toolsWithPolicies.length, 2);
        assertEq(toolsWithPolicies[0].toolIpfsCid, TOOL_IPFS_CID_1);
        assertEq(toolsWithPolicies[0].policies.length, 1);
        assertEq(toolsWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(toolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        // Check the Tool and Policies for App 3 Version 1 for PKP 2 (George)
        toolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(PKP_TOKEN_ID_2, newAppId_3);
        assertEq(toolsWithPolicies.length, 2);
        assertEq(toolsWithPolicies[0].toolIpfsCid, TOOL_IPFS_CID_1);
        assertEq(toolsWithPolicies[0].policies.length, 1);
        assertEq(toolsWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(toolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        VincentUserViewFacet.ToolExecutionValidation memory toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(toolExecutionValidation.isPermitted);
        assertEq(toolExecutionValidation.appId, newAppId_1);
        assertEq(toolExecutionValidation.appVersion, newAppVersion_1);
        assertEq(toolExecutionValidation.policies.length, 1);
        assertEq(toolExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(toolExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_2
        );
        assertTrue(toolExecutionValidation.isPermitted);
        assertEq(toolExecutionValidation.appId, newAppId_1);
        assertEq(toolExecutionValidation.appVersion, newAppVersion_1);
        assertEq(toolExecutionValidation.policies.length, 0);

        toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_DAVID,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(toolExecutionValidation.isPermitted);
        assertEq(toolExecutionValidation.appId, newAppId_2);
        assertEq(toolExecutionValidation.appVersion, newAppVersion_2);
        assertEq(toolExecutionValidation.policies.length, 1);
        assertEq(toolExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(toolExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_EVE,
            PKP_TOKEN_ID_2,
            TOOL_IPFS_CID_1
        );
        assertTrue(toolExecutionValidation.isPermitted);
        assertEq(toolExecutionValidation.appId, newAppId_3);
        assertEq(toolExecutionValidation.appVersion, newAppVersion_3);
        assertEq(toolExecutionValidation.policies.length, 1);
        assertEq(toolExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(toolExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
    }

    function testUnPermitAppVersion() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        (uint256 newAppId_1, uint256 newAppVersion_1) = _registerBasicApp(delegatees);

        delegatees[0] = APP_DELEGATEE_DAVID;
        (uint256 newAppId_2, uint256 newAppVersion_2) = _registerBasicApp(delegatees);

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

        vm.startPrank(APP_USER_FRANK);
        // Expect events for first permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewUserAgentPkpRegistered(APP_USER_FRANK, PKP_TOKEN_ID_1);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId_1, newAppVersion_1);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId_1,
            newAppVersion_1,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 1 Version 1 for PKP 1 (Frank)
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId_1,
            newAppVersion_1,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Expect events for second permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId_2, newAppVersion_2);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId_2,
            newAppVersion_2,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 2 Version 1 for PKP 1 (Frank)
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId_2,
            newAppVersion_2,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Verify initial state
        uint256[] memory permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_1);
        assertEq(permittedAppIds.length, 2);
        assertEq(permittedAppIds[0], newAppId_1);
        assertEq(permittedAppIds[1], newAppId_2);

        // Expect event for unpermit
        vm.startPrank(APP_USER_FRANK);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionUnPermitted(PKP_TOKEN_ID_1, newAppId_1, newAppVersion_1);

        // Unpermit App 1 Version 1 for PKP 1 (Frank)
        vincentUserFacet.unPermitAppVersion(PKP_TOKEN_ID_1, newAppId_1, newAppVersion_1);
        vm.stopPrank();

        // Verify App 1 is no longer permitted
        uint256 permittedAppVersion = vincentUserViewFacet.getPermittedAppVersionForPkp(PKP_TOKEN_ID_1, newAppId_1);
        assertEq(permittedAppVersion, 0);

        // Verify App 2 is still permitted
        permittedAppVersion = vincentUserViewFacet.getPermittedAppVersionForPkp(PKP_TOKEN_ID_1, newAppId_2);
        assertEq(permittedAppVersion, newAppVersion_2);

        // Verify permitted apps list is updated
        permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_1);
        assertEq(permittedAppIds.length, 1);
        assertEq(permittedAppIds[0], newAppId_2);

        // Verify tool execution validation for App 1 is no longer permitted
        VincentUserViewFacet.ToolExecutionValidation memory toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertFalse(toolExecutionValidation.isPermitted);

        // Verify tool execution validation for App 2 is still permitted
        toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_DAVID,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(toolExecutionValidation.isPermitted);
        assertEq(toolExecutionValidation.appId, newAppId_2);
        assertEq(toolExecutionValidation.appVersion, newAppVersion_2);
    }

    function testSetToolPolicyParameters() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        (uint256 newAppId, uint256 newAppVersion) = _registerBasicApp(delegatees);

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

        // First permit the app version
        vm.startPrank(APP_USER_FRANK);
        // Expect events for initial permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewUserAgentPkpRegistered(APP_USER_FRANK, PKP_TOKEN_ID_1);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId, newAppVersion);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Verify initial policy parameters
        VincentUserViewFacet.ToolWithPolicies[] memory toolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(toolsWithPolicies.length, 2);
        assertEq(toolsWithPolicies[0].policies.length, 1);
        assertEq(toolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(toolsWithPolicies[1].policies.length, 0);

        // Update policy parameters
        bytes[][] memory newPolicyParameterValues = new bytes[][](2);
        newPolicyParameterValues[0] = new bytes[](1);
        newPolicyParameterValues[0][0] = POLICY_PARAMETER_VALUES_2; // Change to different value
        newPolicyParameterValues[1] = new bytes[](0);

        // Expect event for setting new policy parameters
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_2
        );

        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            newPolicyParameterValues
        );
        vm.stopPrank();

        // Verify updated policy parameters
        toolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(toolsWithPolicies.length, 2);
        assertEq(toolsWithPolicies[0].policies.length, 1);
        assertEq(toolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_2);
        assertEq(toolsWithPolicies[1].policies.length, 0);

        // Verify tool execution validation returns updated parameters
        VincentUserViewFacet.ToolExecutionValidation memory toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(toolExecutionValidation.isPermitted);
        assertEq(toolExecutionValidation.policies.length, 1);
        assertEq(toolExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_2);
    }

    function testRemoveToolPolicyParameters() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        (uint256 newAppId, uint256 newAppVersion) = _registerBasicApp(delegatees);

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

        // First permit the app version
        vm.startPrank(APP_USER_FRANK);
        // Expect events for initial permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewUserAgentPkpRegistered(APP_USER_FRANK, PKP_TOKEN_ID_1);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId, newAppVersion);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Verify initial policy parameters
        VincentUserViewFacet.ToolWithPolicies[] memory toolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(toolsWithPolicies.length, 2);
        assertEq(toolsWithPolicies[0].policies.length, 1);
        assertEq(toolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(toolsWithPolicies[1].policies.length, 0);

        // Expect event for removing policy parameters
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersRemoved(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1))
        );

        // Remove policy parameters
        vincentUserFacet.removeToolPolicyParameters(
            newAppId,
            PKP_TOKEN_ID_1,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids
        );
        vm.stopPrank();

        // Verify policy parameters are removed
        toolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(toolsWithPolicies.length, 2);
        assertEq(toolsWithPolicies[0].policies.length, 1);
        assertEq(toolsWithPolicies[0].policies[0].policyParameterValues, bytes("")); // Empty bytes after removal
        assertEq(toolsWithPolicies[1].policies.length, 0);

        // Verify tool execution validation returns empty parameters
        VincentUserViewFacet.ToolExecutionValidation memory toolExecutionValidation = vincentUserViewFacet.validateToolExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(toolExecutionValidation.isPermitted);
        assertEq(toolExecutionValidation.policies.length, 1);
        assertEq(toolExecutionValidation.policies[0].policyParameterValues, bytes("")); // Empty bytes after removal
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

    function _registerBasicApp(address[] memory delegatees) private returns (uint256 newAppId, uint256 newAppVersion) {
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
    }
}