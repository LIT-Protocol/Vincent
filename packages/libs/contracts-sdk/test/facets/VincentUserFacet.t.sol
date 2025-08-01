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

    string constant TOOL_IPFS_CID_1 = "QmAbility1";
    string constant TOOL_IPFS_CID_2 = "QmAbility2";
    string constant TOOL_IPFS_CID_3 = "QmAbility3";

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
    string[] abilityIpfsCids = new string[](2);

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

        abilityIpfsCids[0] = TOOL_IPFS_CID_1;
        abilityIpfsCids[1] = TOOL_IPFS_CID_2;
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
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Expect events for second permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId_2, newAppVersion_2);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
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
            abilityIpfsCids,
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
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
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
            abilityIpfsCids,
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

        // Check the Ability and Policies for App 1 Version 1 for PKP 1 (Frank)
        VincentUserViewFacet.AbilityWithPolicies[] memory abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(PKP_TOKEN_ID_1, newAppId_1);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        assertEq(abilitiesWithPolicies[1].abilityIpfsCid, TOOL_IPFS_CID_2);
        assertEq(abilitiesWithPolicies[1].policies.length, 0);

        // Check the Ability and Policies for App 2 Version 1 for PKP 1 (Frank)
        abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(PKP_TOKEN_ID_1, newAppId_2);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        // Check the Ability and Policies for App 3 Version 1 for PKP 2 (George)
        abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(PKP_TOKEN_ID_2, newAppId_3);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].abilityIpfsCid, TOOL_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        VincentUserViewFacet.AbilityExecutionValidation memory abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_1);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_1);
        assertEq(abilityExecutionValidation.policies.length, 1);
        assertEq(abilityExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilityExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_2
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_1);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_1);
        assertEq(abilityExecutionValidation.policies.length, 0);

        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_DAVID,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_2);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_2);
        assertEq(abilityExecutionValidation.policies.length, 1);
        assertEq(abilityExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilityExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_EVE,
            PKP_TOKEN_ID_2,
            TOOL_IPFS_CID_1
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_3);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_3);
        assertEq(abilityExecutionValidation.policies.length, 1);
        assertEq(abilityExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilityExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
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
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Expect events for second permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(PKP_TOKEN_ID_1, newAppId_2, newAppVersion_2);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
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
            abilityIpfsCids,
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

        // Verify ability execution validation for App 1 is no longer permitted
        VincentUserViewFacet.AbilityExecutionValidation memory abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertFalse(abilityExecutionValidation.isPermitted);

        // Verify ability execution validation for App 2 is still permitted
        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_DAVID,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_2);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_2);
    }

    function testSetAbilityPolicyParameters_AbilityPolicyNotRegisteredForAppVersion() public {
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Create arrays with an unregistered policy (POLICY_IPFS_CID_3)
        string[][] memory _policyIpfsCids = new string[][](2);
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_3; // This policy is not registered for the ability
        _policyIpfsCids[1] = new string[](0);

        bytes[][] memory _policyParameterValues = new bytes[][](2);
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;
        _policyParameterValues[1] = new bytes[](0);

        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentUserFacet.AbilityPolicyNotRegisteredForAppVersion.selector,
                newAppId,
                newAppVersion,
                TOOL_IPFS_CID_1,
                POLICY_IPFS_CID_3
            )
        );
        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            _policyIpfsCids,
            _policyParameterValues
        );
    }

    function testRemoveAbilityPolicyParameters() public {
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
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Verify initial policy parameters
        VincentUserViewFacet.AbilityWithPolicies[] memory abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(abilitiesWithPolicies[1].policies.length, 0);

        // Create subset arrays containing only the ability and policy we want to zero out
        string[] memory subsetAbilityIpfsCids = new string[](1);
        subsetAbilityIpfsCids[0] = TOOL_IPFS_CID_1;

        string[][] memory subsetPolicyIpfsCids = new string[][](1);
        subsetPolicyIpfsCids[0] = new string[](1);
        subsetPolicyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory emptyPolicyParameterValues = new bytes[][](1);
        emptyPolicyParameterValues[0] = new bytes[](1);
        emptyPolicyParameterValues[0][0] = bytes(""); // Empty bytes to remove parameter

        // Expect event for setting empty policy parameters
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            bytes("")
        );

        // Set empty policy parameters to effectively remove them
        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            subsetAbilityIpfsCids,
            subsetPolicyIpfsCids,
            emptyPolicyParameterValues
        );
        vm.stopPrank();

        // Verify policy parameters are removed
        abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, bytes("")); // Empty bytes after removal
        assertEq(abilitiesWithPolicies[1].policies.length, 0);

        // Verify ability execution validation returns empty parameters
        VincentUserViewFacet.AbilityExecutionValidation memory abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE,
            PKP_TOKEN_ID_1,
            TOOL_IPFS_CID_1
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.policies.length, 1);
        assertEq(abilityExecutionValidation.policies[0].policyParameterValues, bytes("")); // Empty bytes after removal
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
            abilityIpfsCids,
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
            abilityIpfsCids,
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
            abilityIpfsCids,
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_AbilitiesAndPoliciesLengthMismatch() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // Create arrays with mismatched length

        // Create policy arrays with different length than abilities
        string[][] memory _policyIpfsCids = new string[][](1); // Only 1 policy array for 2 abilities
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory _policyParameterValues = new bytes[][](1); // Only 1 parameter array for 2 abilities
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AbilitiesAndPoliciesLengthMismatch.selector));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Try to permit the same version again
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AppVersionAlreadyPermitted.selector, PKP_TOKEN_ID_1, newAppId, newAppVersion));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_NotAllRegisteredAbilitiesProvided() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // Create arrays with only one ability instead of both registered abilities
        string[] memory _abilityIpfsCids = new string[](1);
        _abilityIpfsCids[0] = TOOL_IPFS_CID_1; // Only providing first ability, missing TOOL_IPFS_CID_2

        string[][] memory _policyIpfsCids = new string[][](1);
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory _policyParameterValues = new bytes[][](1);
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.NotAllRegisteredAbilitiesProvided.selector, newAppId, newAppVersion));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            _abilityIpfsCids,
            _policyIpfsCids,
            _policyParameterValues
        );
    }

    function testPermitAppVersion_AbilityNotRegisteredForAppVersion() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        // Create arrays with an unregistered ability (TOOL_IPFS_CID_3)
        string[] memory _abilityIpfsCids = new string[](2);
        _abilityIpfsCids[0] = TOOL_IPFS_CID_1;
        _abilityIpfsCids[1] = TOOL_IPFS_CID_3; // This ability is not registered for the app version

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AbilityNotRegisteredForAppVersion.selector, newAppId, newAppVersion, TOOL_IPFS_CID_3));
        vincentUserFacet.permitAppVersion(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            _abilityIpfsCids,
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
            abilityIpfsCids,
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
     * ######################### setAbilityPolicyParameters ERROR CASES #########################
     */
    function testSetAbilityPolicyParameters_NotPkpOwner() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

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

        vm.startPrank(APP_USER_GEORGE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.NotPkpOwner.selector, PKP_TOKEN_ID_1, APP_USER_GEORGE));
        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_AppNotRegistered() public {
        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppNotRegistered.selector, 1));
        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            1,
            1,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_AppVersionNotRegistered() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint256 newAppId = 1;
        uint256 newAppVersion = _registerBasicApp(newAppId, delegatees);

        vm.startPrank(APP_USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppVersionNotRegistered.selector, newAppId, newAppVersion + 1));
        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion + 1, // Try to set parameters for a version that hasn't been registered
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_InvalidInput() public {
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Now try to set parameters with an empty ability IPFS CIDs array
        string[] memory emptyAbilityIpfsCids = new string[](0);

        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.InvalidInput.selector));
        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            emptyAbilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_EmptyAbilityIpfsCid() public {
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Create arrays with an empty ability IPFS CID
        string[] memory _abilityIpfsCids = new string[](2);
        _abilityIpfsCids[0] = ""; // Empty string for first ability
        _abilityIpfsCids[1] = TOOL_IPFS_CID_2;

        vm.expectRevert(abi.encodeWithSelector(VincentUserViewFacet.EmptyAbilityIpfsCid.selector));
        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            _abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_NotAllRegisteredAbilitiesProvided() public {
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
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Validate the original ability policies and parameters
        VincentUserViewFacet.AbilityWithPolicies[] memory originalAbilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(originalAbilitiesWithPolicies.length, 2); // Still has both abilities
        assertEq(originalAbilitiesWithPolicies[0].policies.length, 1);
        assertEq(originalAbilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(originalAbilitiesWithPolicies[1].policies.length, 0); // Second ability unchanged

        // Create arrays with only one ability instead of both registered abilities
        string[] memory subsetAbilityIpfsCids = new string[](1);
        subsetAbilityIpfsCids[0] = TOOL_IPFS_CID_1; // Only providing first ability, missing TOOL_IPFS_CID_2

        string[][] memory subsetPolicyIpfsCids = new string[][](1);
        subsetPolicyIpfsCids[0] = new string[](1);
        subsetPolicyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory subsetPolicyParameterValues = new bytes[][](1);
        subsetPolicyParameterValues[0] = new bytes[](1);
        subsetPolicyParameterValues[0][0] = POLICY_PARAMETER_VALUES_2;

         vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(TOOL_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_2
        );

        vincentUserFacet.setAbilityPolicyParameters(
            PKP_TOKEN_ID_1,
            newAppId,
            newAppVersion,
            subsetAbilityIpfsCids,
            subsetPolicyIpfsCids,
            subsetPolicyParameterValues
        );

        // Verify the parameters were updated for the first ability only
        VincentUserViewFacet.AbilityWithPolicies[] memory updatedAbilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(
            PKP_TOKEN_ID_1,
            newAppId
        );
        assertEq(updatedAbilitiesWithPolicies.length, 2); // Still has both abilities
        assertEq(updatedAbilitiesWithPolicies[0].policies.length, 1);
        assertEq(updatedAbilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_2);
        assertEq(updatedAbilitiesWithPolicies[1].policies.length, 0); // Second ability unchanged
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

    function _registerBasicApp(uint256 appId, address[] memory delegatees) private returns (uint256 newAppVersion) {
        VincentAppFacet.AppVersionAbilities memory versionAbilities;
        versionAbilities.abilityIpfsCids = new string[](2);

        versionAbilities.abilityIpfsCids[0] = TOOL_IPFS_CID_1;
        versionAbilities.abilityIpfsCids[1] = TOOL_IPFS_CID_2;

        versionAbilities.abilityPolicies = new string[][](2);

        versionAbilities.abilityPolicies[0] = new string[](1);
        versionAbilities.abilityPolicies[0][0] = POLICY_IPFS_CID_1;

        versionAbilities.abilityPolicies[1] = new string[](0);
        
        return _registerApp(appId, delegatees, versionAbilities);
    }
}
