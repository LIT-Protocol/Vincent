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
import {LibVincentUserFacet} from "../../contracts/libs/LibVincentUserFacet.sol";
import {VincentBase} from "../../contracts/VincentBase.sol";

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

    string[][] policyIpfsCids = new string[][](2);
    bytes[][] policyParameterValues = new bytes[][](2);
    string[] toolIpfsCids = new string[](2);

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

        policyIpfsCids[0] = new string[](1);
        policyIpfsCids[0][0] = POLICY_IPFS_CID_1;
        policyIpfsCids[1] = new string[](0);

        policyParameterValues[0] = new bytes[](1);
        policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        policyParameterValues[1] = new bytes[](0);

        toolIpfsCids[0] = TOOL_IPFS_CID_1;
        toolIpfsCids[1] = TOOL_IPFS_CID_2;
    }

    function testPermitAppVersion() public {
        address[] memory delegatees = new address[](1);

        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId_1 = 1;
        uint256 newAppVersion_1 = _registerBasicApp(newAppId_1, delegatees);

        delegatees[0] = APP_DELEGATEE_DAVID;
        uint256 newAppId_2 = 2;
        uint256 newAppVersion_2 = _registerBasicApp(newAppId_2, delegatees);

        delegatees[0] = APP_DELEGATEE_EVE;
        uint256 newAppId_3 = 3;
        uint256 newAppVersion_3 = _registerBasicApp(newAppId_3, delegatees);

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
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
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
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
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
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
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
        uint256[] memory registeredAgentPkps = vincentUserViewFacet.getAllRegisteredAgentPkps(APP_USER_FRANK, 0, 10); // Just chose 10 arbitrarily
        assertEq(registeredAgentPkps.length, 1);
        assertEq(registeredAgentPkps[0], PKP_TOKEN_ID_1);

        // Check that George has registered PKP 2
        registeredAgentPkps = vincentUserViewFacet.getAllRegisteredAgentPkps(APP_USER_GEORGE, 0, 10);
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
        uint256[] memory permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_1, 0, 10);
        assertEq(permittedAppIds.length, 2);
        assertEq(permittedAppIds[0], newAppId_1);
        assertEq(permittedAppIds[1], newAppId_2);

        // Check that George has permitted App 3
        permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_2, 0, 10);
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
        uint256 newAppId_1 = 1;
        uint256 newAppVersion_1 = _registerBasicApp(newAppId_1, delegatees);

        delegatees[0] = APP_DELEGATEE_DAVID;
        uint256 newAppId_2 = 2;
        uint256 newAppVersion_2 = _registerBasicApp(newAppId_2, delegatees);

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
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
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
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
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
        uint256[] memory permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_1, 0, 10);
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
        permittedAppIds = vincentUserViewFacet.getAllPermittedAppIdsForPkp(PKP_TOKEN_ID_1, 0, 10);
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

    function testSetToolPolicyParameters_ToolPolicyNotRegisteredForAppVersion() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Create arrays with an unregistered policy (POLICY_IPFS_CID_3)
        string[][] memory _policyIpfsCids = new string[][](2);
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_3; // This policy is not registered for the tool
        _policyIpfsCids[1] = new string[](0);

        bytes[][] memory _policyParameterValues = new bytes[][](2);
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        _policyParameterValues[1] = new bytes[](0);

        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentUserFacet.ToolPolicyNotRegisteredForAppVersion.selector,
                newAppId,
                newAppVersion,
                TOOL_IPFS_CID_1,
                POLICY_IPFS_CID_3
            )
        );
        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            _policyIpfsCids,
            _policyParameterValues
        );
    }

    function testRemoveToolPolicyParameters() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

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
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
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

        // Create subset arrays containing only the tool and policy we want to zero out
        string[] memory subsetToolIpfsCids = new string[](1);
        subsetToolIpfsCids[0] = TOOL_IPFS_CID_1;

        string[][] memory subsetPolicyIpfsCids = new string[][](1);
        subsetPolicyIpfsCids[0] = new string[](1);
        subsetPolicyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory emptyPolicyParameterValues = new bytes[][](1);
        emptyPolicyParameterValues[0] = new bytes[](1);
        emptyPolicyParameterValues[0][0] = bytes(""); // Empty bytes to remove parameter

        // Expect event for setting empty policy parameters
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            bytes("")
        );

        // Set empty policy parameters to effectively remove them
        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            subsetToolIpfsCids,
            subsetPolicyIpfsCids,
            emptyPolicyParameterValues
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

    /**
     * ######################### permitAppVersion ERROR CASES #########################
     */
    function testPermitAppVersion_AppHasBeenDeleted() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        vm.stopPrank();

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_NotPkpOwner() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_GEORGE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.NotPkpOwner.selector, PKP_TOKEN_ID_1, APP_USER_GEORGE));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_AppNotRegistered() public {
        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppNotRegistered.selector, 1));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            1,
            1,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_AppVersionNotRegistered() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppVersionNotRegistered.selector, newAppId, newAppVersion + 1));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion + 1, // Try to permit a version that hasn't been registered
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_ToolsAndPoliciesLengthMismatch() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // Create arrays with mismatched length

        // Create policy arrays with different length than tools
        string[][] memory _policyIpfsCids = new string[][](1); // Only 1 policy array for 2 tools
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory _policyParameterValues = new bytes[][](1); // Only 1 parameter array for 2 tools
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.ToolsAndPoliciesLengthMismatch.selector));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            _policyIpfsCids,
            _policyParameterValues
        );
    }

    function testPermitAppVersion_AppVersionAlreadyPermitted() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // First permit the app version
        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Try to permit the same version again
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AppVersionAlreadyPermitted.selector, PKP_TOKEN_ID_1, newAppId, newAppVersion));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_AppVersionNotEnabled() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.enableAppVersion(newAppId, newAppVersion, false);
        vm.stopPrank();

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AppVersionNotEnabled.selector, newAppId, newAppVersion));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_NotAllRegisteredToolsProvided() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // Create arrays with only one tool instead of both registered tools
        string[] memory _toolIpfsCids = new string[](1);
        _toolIpfsCids[0] = TOOL_IPFS_CID_1; // Only providing first tool, missing TOOL_IPFS_CID_2

        string[][] memory _policyIpfsCids = new string[][](1);
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory _policyParameterValues = new bytes[][](1);
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.NotAllRegisteredToolsProvided.selector, newAppId, newAppVersion));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            _toolIpfsCids,
            _policyIpfsCids,
            _policyParameterValues
        );
    }

    function testPermitAppVersion_ToolNotRegisteredForAppVersion() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // Create arrays with an unregistered tool (TOOL_IPFS_CID_3)
        string[] memory _toolIpfsCids = new string[](2);
        _toolIpfsCids[0] = TOOL_IPFS_CID_1;
        _toolIpfsCids[1] = TOOL_IPFS_CID_3; // This tool is not registered for the app version

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.ToolNotRegisteredForAppVersion.selector, newAppId, newAppVersion, TOOL_IPFS_CID_3));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            _toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    /**
     * ######################### unPermitAppVersion ERROR CASES #########################
     */
    function testUnPermitAppVersion_NotPkpOwner() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(APP_DELEGATEE_CHARLIE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.NotPkpOwner.selector, PKP_TOKEN_ID_1, APP_DELEGATEE_CHARLIE));
        vincentUserFacet.unPermitAppVersion(PKP_TOKEN_ID_1, newAppId, newAppVersion);
    }

    function testUnPermitAppVersion_AppNotRegistered() public {
        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppNotRegistered.selector, 1));
        vincentUserFacet.unPermitAppVersion(PKP_TOKEN_ID_1, 1, 1);
    }

    function testUnPermitAppVersion_AppVersionNotRegistered() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppVersionNotRegistered.selector, newAppId, newAppVersion + 1));
        vincentUserFacet.unPermitAppVersion(PKP_TOKEN_ID_1, newAppId, newAppVersion + 1);
    }

    function testUnPermitAppVersion_AppVersionNotPermitted() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AppVersionNotPermitted.selector, PKP_TOKEN_ID_1, newAppId, newAppVersion));
        vincentUserFacet.unPermitAppVersion(PKP_TOKEN_ID_1, newAppId, newAppVersion);
    }

    /**
     * ######################### setToolPolicyParameters ERROR CASES #########################
     */
    function testSetToolPolicyParameters_NotPkpOwner() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(APP_USER_GEORGE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.NotPkpOwner.selector, PKP_TOKEN_ID_1, APP_USER_GEORGE));
        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetToolPolicyParameters_AppNotRegistered() public {
        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppNotRegistered.selector, 1));
        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            1,
            1,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetToolPolicyParameters_AppVersionNotRegistered() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppVersionNotRegistered.selector, newAppId, newAppVersion + 1));
        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion + 1, // Try to set parameters for a version that hasn't been registered
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetToolPolicyParameters_InvalidInput() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Now try to set parameters with an empty tool IPFS CIDs array
        string[] memory emptyToolIpfsCids = new string[](0);

        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.InvalidInput.selector));
        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            emptyToolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetToolPolicyParameters_EmptyToolIpfsCid() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Create arrays with an empty tool IPFS CID
        string[] memory _toolIpfsCids = new string[](2);
        _toolIpfsCids[0] = ""; // Empty string for first tool
        _toolIpfsCids[1] = TOOL_IPFS_CID_2;

        vm.expectRevert(abi.encodeWithSelector(VincentUserViewFacet.EmptyToolIpfsCid.selector));
        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            _toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetToolPolicyParameters_NotAllRegisteredToolsProvided() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(APP_USER_FRANK);
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Validate the original tool policies and parameters
        VincentUserViewFacet.ToolWithPolicies[] memory originalToolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(originalToolsWithPolicies.length, 2); // Still has both tools
        assertEq(originalToolsWithPolicies[0].policies.length, 1);
        assertEq(originalToolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(originalToolsWithPolicies[1].policies.length, 0); // Second tool unchanged

        // Create arrays with only one tool instead of both registered tools
        string[] memory subsetToolIpfsCids = new string[](1);
        subsetToolIpfsCids[0] = TOOL_IPFS_CID_1; // Only providing first tool, missing TOOL_IPFS_CID_2

        string[][] memory subsetPolicyIpfsCids = new string[][](1);
        subsetPolicyIpfsCids[0] = new string[](1);
        subsetPolicyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory subsetPolicyParameterValues = new bytes[][](1);
        subsetPolicyParameterValues[0] = new bytes[](1);
        subsetPolicyParameterValues[0][0] = POLICY_PARAMETER_VALUES_2;

         vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.ToolPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_2
        );

        vincentUserFacet.setToolPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            subsetToolIpfsCids,
            subsetPolicyIpfsCids,
            subsetPolicyParameterValues
        );

        // Verify the parameters were updated for the first tool only
        VincentUserViewFacet.ToolWithPolicies[] memory updatedToolsWithPolicies = vincentUserViewFacet.getAllToolsAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(updatedToolsWithPolicies.length, 2); // Still has both tools
        assertEq(updatedToolsWithPolicies[0].policies.length, 1);
        assertEq(updatedToolsWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_2);
        assertEq(updatedToolsWithPolicies[1].policies.length, 0); // Second tool unchanged
    }

    function _registerApp(
        uint256 appId,
        address[] memory delegatees,
        VincentAppFacet.AppVersionTools memory versionTools
    ) private returns (uint256) {
        vm.startPrank(APP_MANAGER_ALICE);
        uint256 newAppVersion = vincentAppFacet.registerApp(appId, delegatees, versionTools);
        vm.stopPrank();

        return newAppVersion;
    }

    function _registerBasicApp(uint256 appId, address[] memory delegatees) private returns (uint256 newAppVersion) {
        VincentAppFacet.AppVersionTools memory versionTools;
        versionTools.toolIpfsCids = new string[](2);

        versionTools.toolIpfsCids[0] = TOOL_IPFS_CID_1;
        versionTools.toolIpfsCids[1] = TOOL_IPFS_CID_2;

        versionTools.toolPolicies = new string[][](2);

        versionTools.toolPolicies[0] = new string[](1);
        versionTools.toolPolicies[0][0] = POLICY_IPFS_CID_1;

        versionTools.toolPolicies[1] = new string[](0);
        
        return _registerApp(appId, delegatees, versionTools);
    }
}