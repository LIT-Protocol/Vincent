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
import {LibVincentUserFacet} from "../../contracts/libs/LibVincentUserFacet.sol";
import {VincentBase} from "../../contracts/VincentBase.sol";

contract VincentUserFacetTest is Test {
    string constant ABILITY_IPFS_CID_1 = "QmAbility1";
    string constant ABILITY_IPFS_CID_2 = "QmAbility2";
    string constant ABILITY_IPFS_CID_3 = "QmAbility3";

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

    address USER_FRANK = makeAddr("Frank");
    address USER_GEORGE = makeAddr("George");

    address APP_USER_FRANK = makeAddr("Frank_App_Account");
    address APP_USER_GEORGE = makeAddr("George_App_Account");

    address FRANK_PKP_SIGNER = makeAddr("FrankPkpSigner");
    address FRANK_PKP_SIGNER_2 = makeAddr("FrankPkpSigner2");
    address GEORGE_PKP_SIGNER = makeAddr("GeorgePkpSigner");

    bytes constant FRANK_PKP_SIGNER_PUB_KEY = hex"0255b1d15a6ed11596e193d74788812e751ec8fdc30e02f194d4c86bd30e0e5e7b";
    bytes constant FRANK_PKP_SIGNER_PUB_KEY_2 = hex"033abaaea71ec690882c2f55121e020e731e5d7f6ffc677879947278f30a486edd";
    bytes constant GEORGE_PKP_SIGNER_PUB_KEY = hex"02ee8087951fe615e7c2510c2533ab3ad013376a684150734ff4359bc22a94df0b";

    address FRANK_AGENT_ADDRESS = makeAddr("FrankAgentAddress");
    address FRANK_AGENT_ADDRESS_2 = makeAddr("FrankAgentAddress2");
    address GEORGE_AGENT_ADDRESS = makeAddr("GeorgeAgentAddress");

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

        address diamondAddress = deployScript.deployToNetwork("test", keccak256("VincentCreate2Salt_2"));
        vincentDiamond = VincentDiamond(payable(diamondAddress));

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

        abilityIpfsCids[0] = ABILITY_IPFS_CID_1;
        abilityIpfsCids[1] = ABILITY_IPFS_CID_2;
    }

    function testPermitAppVersion() public {
        address[] memory delegatees = new address[](1);

        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId_1 = 1;
        uint24 newAppVersion_1 = _registerBasicApp(delegatees);

        delegatees[0] = APP_DELEGATEE_DAVID;
        uint40 newAppId_2 = 2;
        uint24 newAppVersion_2 = _registerBasicApp(delegatees);

        delegatees[0] = APP_DELEGATEE_EVE;
        uint40 newAppId_3 = 3;
        uint24 newAppVersion_3 = _registerBasicApp(delegatees);

        vm.startPrank(USER_FRANK);
        // Expect events for first permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewAgentRegistered(
            USER_FRANK, FRANK_AGENT_ADDRESS, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(
            FRANK_AGENT_ADDRESS, newAppId_1, newAppVersion_1, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            FRANK_AGENT_ADDRESS,
            newAppId_1,
            newAppVersion_1,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 1 Version 1 for Frank
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId_1,
            newAppVersion_1,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(USER_FRANK);
        // Expect events for second permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(
            FRANK_AGENT_ADDRESS_2, newAppId_2, newAppVersion_2, FRANK_PKP_SIGNER_2, FRANK_PKP_SIGNER_PUB_KEY_2
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            FRANK_AGENT_ADDRESS_2,
            newAppId_2,
            newAppVersion_2,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 2 Version 1 for Frank
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS_2,
            FRANK_PKP_SIGNER_2,
            FRANK_PKP_SIGNER_PUB_KEY_2,
            newAppId_2,
            newAppVersion_2,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(USER_GEORGE);
        // Expect events for third permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewAgentRegistered(
            USER_GEORGE, GEORGE_AGENT_ADDRESS, GEORGE_PKP_SIGNER, GEORGE_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(
            GEORGE_AGENT_ADDRESS, newAppId_3, newAppVersion_3, GEORGE_PKP_SIGNER, GEORGE_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            GEORGE_AGENT_ADDRESS,
            newAppId_3,
            newAppVersion_3,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 3 Version 1 for George
        vincentUserFacet.permitAppVersion(
            GEORGE_AGENT_ADDRESS,
            GEORGE_PKP_SIGNER,
            GEORGE_PKP_SIGNER_PUB_KEY,
            newAppId_3,
            newAppVersion_3,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Check that Frank has registered agent addresses
        address[] memory registeredAgentAddresses =
            vincentUserViewFacet.getAllRegisteredAgentAddressesForUser(USER_FRANK, 0);
        assertEq(registeredAgentAddresses.length, 2);
        assertEq(registeredAgentAddresses[0], FRANK_AGENT_ADDRESS);
        assertEq(registeredAgentAddresses[1], FRANK_AGENT_ADDRESS_2);

        // Check that George has registered agent addresses
        registeredAgentAddresses = vincentUserViewFacet.getAllRegisteredAgentAddressesForUser(USER_GEORGE, 0);
        assertEq(registeredAgentAddresses.length, 1);
        assertEq(registeredAgentAddresses[0], GEORGE_AGENT_ADDRESS);

        // Check that Frank has permitted App 1 Version 1
        address[] memory agentAddresses = new address[](1);
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        VincentUserViewFacet.AgentPermittedApp[] memory permittedApps =
            vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps[0].permittedApp.appId, newAppId_1);
        assertEq(permittedApps[0].permittedApp.version, newAppVersion_1);

        // Check that Frank has permitted App 2 Version 1
        agentAddresses[0] = FRANK_AGENT_ADDRESS_2;
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps[0].permittedApp.appId, newAppId_2);
        assertEq(permittedApps[0].permittedApp.version, newAppVersion_2);

        // Check that George has permitted App 3 Version 1
        agentAddresses[0] = GEORGE_AGENT_ADDRESS;
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps[0].permittedApp.appId, newAppId_3);
        assertEq(permittedApps[0].permittedApp.version, newAppVersion_3);

        // Test getPermittedAppForAgents for both agents
        agentAddresses = new address[](3);
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        agentAddresses[1] = FRANK_AGENT_ADDRESS_2;
        agentAddresses[2] = GEORGE_AGENT_ADDRESS;
        VincentUserViewFacet.AgentPermittedApp[] memory permittedAppsResults =
            vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedAppsResults.length, 3);

        // Check Frank's apps for Agent 1
        assertEq(permittedAppsResults[0].agentAddress, FRANK_AGENT_ADDRESS);
        assertEq(permittedAppsResults[0].permittedApp.appId, newAppId_1);
        assertEq(permittedAppsResults[0].permittedApp.version, newAppVersion_1);
        assertEq(permittedAppsResults[0].permittedApp.pkpSigner, FRANK_PKP_SIGNER);
        assertEq(permittedAppsResults[0].permittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY);
        assertTrue(permittedAppsResults[0].permittedApp.versionEnabled);

        // Check Frank's apps for Agent 2
        assertEq(permittedAppsResults[1].agentAddress, FRANK_AGENT_ADDRESS_2);
        assertEq(permittedAppsResults[1].permittedApp.appId, newAppId_2);
        assertEq(permittedAppsResults[1].permittedApp.version, newAppVersion_2);
        assertEq(permittedAppsResults[1].permittedApp.pkpSigner, FRANK_PKP_SIGNER_2);
        assertEq(permittedAppsResults[1].permittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY_2);
        assertTrue(permittedAppsResults[1].permittedApp.versionEnabled);

        // Check George's apps for Agent 1
        assertEq(permittedAppsResults[2].agentAddress, GEORGE_AGENT_ADDRESS);
        assertEq(permittedAppsResults[2].permittedApp.appId, newAppId_3);
        assertEq(permittedAppsResults[2].permittedApp.version, newAppVersion_3);
        assertEq(permittedAppsResults[2].permittedApp.pkpSigner, GEORGE_PKP_SIGNER);
        assertEq(permittedAppsResults[2].permittedApp.pkpSignerPubKey, GEORGE_PKP_SIGNER_PUB_KEY);
        assertTrue(permittedAppsResults[2].permittedApp.versionEnabled);

        // Validate getPermittedAppForAgents works for getting PKP signer info
        agentAddresses = new address[](1);
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps[0].permittedApp.pkpSigner, FRANK_PKP_SIGNER);
        assertEq(permittedApps[0].permittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY);

        // Validate getUserAddressForAgent works for registered agents
        address userAddressForFrankAgent1 = vincentUserViewFacet.getUserAddressForAgent(FRANK_AGENT_ADDRESS);
        assertEq(userAddressForFrankAgent1, USER_FRANK);

        address userAddressForFrankAgent2 = vincentUserViewFacet.getUserAddressForAgent(FRANK_AGENT_ADDRESS_2);
        assertEq(userAddressForFrankAgent2, USER_FRANK);

        address userAddressForGeorgeAgent = vincentUserViewFacet.getUserAddressForAgent(GEORGE_AGENT_ADDRESS);
        assertEq(userAddressForGeorgeAgent, USER_GEORGE);

        // Validate getUserAddressForAgent reverts for unregistered agents
        address unregisteredAgent = makeAddr("UnregisteredAgent");
        vm.expectRevert(abi.encodeWithSelector(VincentUserViewFacet.AgentNotRegistered.selector, unregisteredAgent));
        vincentUserViewFacet.getUserAddressForAgent(unregisteredAgent);

        // Check the Ability and Policies for App 1 Version 1 for Frank Agent 1
        VincentUserViewFacet.AbilityWithPolicies[] memory abilitiesWithPolicies =
            vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(FRANK_AGENT_ADDRESS, newAppId_1);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].abilityIpfsCid, ABILITY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        assertEq(abilitiesWithPolicies[1].abilityIpfsCid, ABILITY_IPFS_CID_2);
        assertEq(abilitiesWithPolicies[1].policies.length, 0);

        // Check the Ability and Policies for App 2 Version 1 for Frank Agent 2
        abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(FRANK_AGENT_ADDRESS_2, newAppId_2);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].abilityIpfsCid, ABILITY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        // Check the Ability and Policies for App 3 Version 1 for George Agent 1
        abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(GEORGE_AGENT_ADDRESS, newAppId_3);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].abilityIpfsCid, ABILITY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        VincentUserViewFacet.AbilityExecutionValidation memory abilityExecutionValidation =
            vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
                APP_DELEGATEE_CHARLIE, FRANK_AGENT_ADDRESS, ABILITY_IPFS_CID_1
            );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_1);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_1);
        assertEq(abilityExecutionValidation.policies.length, 1);
        assertEq(abilityExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilityExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_CHARLIE, FRANK_AGENT_ADDRESS, ABILITY_IPFS_CID_2
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_1);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_1);
        assertEq(abilityExecutionValidation.policies.length, 0);

        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_DAVID, FRANK_AGENT_ADDRESS_2, ABILITY_IPFS_CID_1
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_2);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_2);
        assertEq(abilityExecutionValidation.policies.length, 1);
        assertEq(abilityExecutionValidation.policies[0].policyIpfsCid, POLICY_IPFS_CID_1);
        assertEq(abilityExecutionValidation.policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);

        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_EVE, GEORGE_AGENT_ADDRESS, ABILITY_IPFS_CID_1
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
        uint40 newAppId_1 = 1;
        uint24 newAppVersion_1 = _registerBasicApp(delegatees);

        delegatees[0] = APP_DELEGATEE_DAVID;
        uint40 newAppId_2 = 2;
        uint24 newAppVersion_2 = _registerBasicApp(delegatees);

        vm.startPrank(USER_FRANK);
        // Expect events for first permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewAgentRegistered(
            USER_FRANK, FRANK_AGENT_ADDRESS, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(
            FRANK_AGENT_ADDRESS, newAppId_1, newAppVersion_1, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            FRANK_AGENT_ADDRESS,
            newAppId_1,
            newAppVersion_1,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 1 Version 1 for PKP 1 (Frank)
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId_1,
            newAppVersion_1,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        vm.startPrank(USER_FRANK);
        // Expect events for second permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(
            FRANK_AGENT_ADDRESS_2, newAppId_2, newAppVersion_2, FRANK_PKP_SIGNER_2, FRANK_PKP_SIGNER_PUB_KEY_2
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            FRANK_AGENT_ADDRESS_2,
            newAppId_2,
            newAppVersion_2,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        // Permit App 2 Version 1 for PKP 1 (Frank)
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS_2,
            FRANK_PKP_SIGNER_2,
            FRANK_PKP_SIGNER_PUB_KEY_2,
            newAppId_2,
            newAppVersion_2,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Verify initial state
        address[] memory agentAddresses = new address[](2);
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        agentAddresses[1] = FRANK_AGENT_ADDRESS_2;
        VincentUserViewFacet.AgentPermittedApp[] memory permittedApps =
            vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps.length, 2);
        assertEq(permittedApps[0].agentAddress, FRANK_AGENT_ADDRESS);
        assertEq(permittedApps[0].permittedApp.appId, newAppId_1);
        assertEq(permittedApps[0].permittedApp.version, newAppVersion_1);
        assertEq(permittedApps[0].permittedApp.pkpSigner, FRANK_PKP_SIGNER);
        assertEq(permittedApps[0].permittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY);
        assertTrue(permittedApps[0].permittedApp.versionEnabled);

        assertEq(permittedApps[1].agentAddress, FRANK_AGENT_ADDRESS_2);
        assertEq(permittedApps[1].permittedApp.appId, newAppId_2);
        assertEq(permittedApps[1].permittedApp.version, newAppVersion_2);
        assertEq(permittedApps[1].permittedApp.pkpSigner, FRANK_PKP_SIGNER_2);
        assertEq(permittedApps[1].permittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY_2);
        assertTrue(permittedApps[1].permittedApp.versionEnabled);

        // Expect event for unpermit App 1
        vm.startPrank(USER_FRANK);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionUnPermitted(
            FRANK_AGENT_ADDRESS, newAppId_1, newAppVersion_1, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );

        // Unpermit App 1 Version 1 for PKP 1 (Frank)
        vincentUserFacet.unPermitAppVersion(FRANK_AGENT_ADDRESS, newAppId_1, newAppVersion_1);
        vm.stopPrank();

        // Verify App 1 is no longer permitted
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps.length, 2); // Still returns 2 results (one per agent)
        // First agent has no app permitted
        assertEq(permittedApps[0].agentAddress, FRANK_AGENT_ADDRESS);
        assertEq(permittedApps[0].permittedApp.appId, 0);
        assertEq(permittedApps[0].permittedApp.pkpSigner, address(0));
        assertEq(permittedApps[0].permittedApp.pkpSignerPubKey, hex"");

        // Second agent still has App 2 permitted
        assertEq(permittedApps[1].agentAddress, FRANK_AGENT_ADDRESS_2);
        assertEq(permittedApps[1].permittedApp.appId, newAppId_2);
        assertEq(permittedApps[1].permittedApp.version, newAppVersion_2);
        assertEq(permittedApps[1].permittedApp.pkpSigner, FRANK_PKP_SIGNER_2);
        assertEq(permittedApps[1].permittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY_2);
        assertTrue(permittedApps[1].permittedApp.versionEnabled);

        agentAddresses = new address[](1);
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps[0].permittedApp.appId, 0);

        agentAddresses[0] = FRANK_AGENT_ADDRESS_2;
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps[0].permittedApp.appId, newAppId_2);
        assertEq(permittedApps[0].permittedApp.version, newAppVersion_2);

        // Verify ability execution validation for App 1 is no longer permitted
        VincentUserViewFacet.AbilityExecutionValidation memory abilityExecutionValidation =
            vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
                APP_DELEGATEE_CHARLIE, FRANK_AGENT_ADDRESS, ABILITY_IPFS_CID_1
            );
        assertFalse(abilityExecutionValidation.isPermitted);

        // Verify ability execution validation for App 2 is still permitted
        abilityExecutionValidation = vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
            APP_DELEGATEE_DAVID, FRANK_AGENT_ADDRESS_2, ABILITY_IPFS_CID_1
        );
        assertTrue(abilityExecutionValidation.isPermitted);
        assertEq(abilityExecutionValidation.appId, newAppId_2);
        assertEq(abilityExecutionValidation.appVersion, newAppVersion_2);

        // Test getUnpermittedAppsForPkps should show only App 1 as unpermitted
        agentAddresses = new address[](2);
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        agentAddresses[1] = FRANK_AGENT_ADDRESS_2;
        VincentUserViewFacet.AgentUnpermittedApp[] memory unpermittedAppsResults =
            vincentUserViewFacet.getUnpermittedAppForAgents(agentAddresses);
        assertEq(unpermittedAppsResults.length, 2);
        assertEq(unpermittedAppsResults[0].agentAddress, FRANK_AGENT_ADDRESS);
        assertEq(unpermittedAppsResults[0].unpermittedApp.appId, newAppId_1);
        assertEq(unpermittedAppsResults[0].unpermittedApp.previousPermittedVersion, newAppVersion_1);
        assertEq(unpermittedAppsResults[0].unpermittedApp.pkpSigner, FRANK_PKP_SIGNER);
        assertEq(unpermittedAppsResults[0].unpermittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY);
        assertTrue(unpermittedAppsResults[0].unpermittedApp.versionEnabled);

        assertEq(unpermittedAppsResults[1].agentAddress, FRANK_AGENT_ADDRESS_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.appId, 0);
        assertEq(unpermittedAppsResults[1].unpermittedApp.previousPermittedVersion, 0);
        assertEq(unpermittedAppsResults[1].unpermittedApp.pkpSigner, address(0));
        assertEq(unpermittedAppsResults[1].unpermittedApp.pkpSignerPubKey, hex"");
        assertFalse(unpermittedAppsResults[1].unpermittedApp.versionEnabled);

        // Now unpermit App 2 as well
        vm.startPrank(USER_FRANK);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionUnPermitted(
            FRANK_AGENT_ADDRESS_2, newAppId_2, newAppVersion_2, FRANK_PKP_SIGNER_2, FRANK_PKP_SIGNER_PUB_KEY_2
        );

        // Unpermit App 2 Version 1 for PKP 1 (Frank)
        vincentUserFacet.unPermitAppVersion(FRANK_AGENT_ADDRESS_2, newAppId_2, newAppVersion_2);
        vm.stopPrank();

        // Verify permitted apps list is now empty
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps.length, 2);
        assertEq(permittedApps[0].agentAddress, FRANK_AGENT_ADDRESS);
        assertEq(permittedApps[0].permittedApp.appId, 0);
        assertEq(permittedApps[0].permittedApp.version, 0);
        assertFalse(permittedApps[0].permittedApp.versionEnabled);

        assertEq(permittedApps[1].agentAddress, FRANK_AGENT_ADDRESS_2);
        assertEq(permittedApps[1].permittedApp.appId, 0);
        assertEq(permittedApps[1].permittedApp.version, 0);
        assertEq(permittedApps[1].permittedApp.pkpSigner, address(0));
        assertEq(permittedApps[1].permittedApp.pkpSignerPubKey, hex"");
        assertFalse(permittedApps[1].permittedApp.versionEnabled);

        // Test getUnpermittedAppForAgents to verify last permitted versions for both unpermitted apps
        agentAddresses = new address[](2);
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        agentAddresses[1] = FRANK_AGENT_ADDRESS_2;
        VincentUserViewFacet.AgentUnpermittedApp[] memory unpermittedApps =
            vincentUserViewFacet.getUnpermittedAppForAgents(agentAddresses);
        assertEq(unpermittedApps[0].unpermittedApp.appId, newAppId_1);
        assertEq(
            unpermittedApps[0].unpermittedApp.previousPermittedVersion,
            newAppVersion_1,
            "Last permitted version should be stored for App 1"
        );
        assertEq(unpermittedApps[1].unpermittedApp.appId, newAppId_2);
        assertEq(
            unpermittedApps[1].unpermittedApp.previousPermittedVersion,
            newAppVersion_2,
            "Last permitted version should be stored for App 2"
        );

        // Test getUnpermittedAppForAgents should show each agent's unpermitted app
        unpermittedAppsResults = vincentUserViewFacet.getUnpermittedAppForAgents(agentAddresses);
        assertEq(unpermittedAppsResults.length, 2);
        // First agent has App 1 unpermitted
        assertEq(unpermittedAppsResults[0].agentAddress, FRANK_AGENT_ADDRESS);
        assertEq(unpermittedAppsResults[0].unpermittedApp.appId, newAppId_1);
        assertEq(unpermittedAppsResults[0].unpermittedApp.previousPermittedVersion, newAppVersion_1);
        assertEq(unpermittedAppsResults[0].unpermittedApp.pkpSigner, FRANK_PKP_SIGNER);
        assertEq(unpermittedAppsResults[0].unpermittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY);
        assertTrue(unpermittedAppsResults[0].unpermittedApp.versionEnabled);
        // Second agent has App 2 unpermitted
        assertEq(unpermittedAppsResults[1].agentAddress, FRANK_AGENT_ADDRESS_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.appId, newAppId_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.previousPermittedVersion, newAppVersion_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.pkpSigner, FRANK_PKP_SIGNER_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY_2);
        assertTrue(unpermittedAppsResults[1].unpermittedApp.versionEnabled);

        // Test rePermitApp to re-permit App 1
        vm.startPrank(USER_FRANK);
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionRePermitted(
            FRANK_AGENT_ADDRESS, newAppId_1, newAppVersion_1, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );
        vincentUserFacet.rePermitApp(FRANK_AGENT_ADDRESS, newAppId_1);
        vm.stopPrank();

        // Verify App 1 is permitted again with the same version
        agentAddresses[0] = FRANK_AGENT_ADDRESS;
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps[0].permittedApp.appId, newAppId_1, "App should be re-permitted");
        assertEq(permittedApps[0].permittedApp.version, newAppVersion_1, "App should be re-permitted with last version");

        // Verify initial policy parameters
        VincentUserViewFacet.AbilityWithPolicies[] memory abilitiesWithPolicies =
            vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(FRANK_AGENT_ADDRESS, newAppId_1);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(abilitiesWithPolicies[1].policies.length, 0);

        // Verify only App 1 is permitted again (App 2 remains unpermitted)
        permittedApps = vincentUserViewFacet.getPermittedAppForAgents(agentAddresses);
        assertEq(permittedApps.length, 2);
        assertEq(permittedApps[0].permittedApp.appId, newAppId_1);
        assertEq(permittedApps[0].permittedApp.version, newAppVersion_1);
        assertEq(permittedApps[0].permittedApp.pkpSigner, FRANK_PKP_SIGNER);
        assertEq(permittedApps[0].permittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY);
        assertTrue(permittedApps[0].permittedApp.versionEnabled);

        assertEq(permittedApps[1].permittedApp.appId, 0);
        assertEq(permittedApps[1].permittedApp.version, 0);
        assertEq(permittedApps[1].permittedApp.pkpSigner, address(0));
        assertEq(permittedApps[1].permittedApp.pkpSignerPubKey, hex"");
        assertFalse(permittedApps[1].permittedApp.versionEnabled);

        // Verify only App 2 remains unpermitted
        unpermittedAppsResults = vincentUserViewFacet.getUnpermittedAppForAgents(agentAddresses);
        assertEq(unpermittedAppsResults.length, 2);
        assertEq(unpermittedAppsResults[0].unpermittedApp.appId, 0);
        assertEq(unpermittedAppsResults[0].unpermittedApp.previousPermittedVersion, 0);
        assertEq(unpermittedAppsResults[0].unpermittedApp.pkpSigner, address(0));
        assertEq(unpermittedAppsResults[0].unpermittedApp.pkpSignerPubKey, hex"");
        assertFalse(unpermittedAppsResults[0].unpermittedApp.versionEnabled);

        assertEq(unpermittedAppsResults[1].agentAddress, FRANK_AGENT_ADDRESS_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.appId, newAppId_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.previousPermittedVersion, newAppVersion_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.pkpSigner, FRANK_PKP_SIGNER_2);
        assertEq(unpermittedAppsResults[1].unpermittedApp.pkpSignerPubKey, FRANK_PKP_SIGNER_PUB_KEY_2);
        assertTrue(unpermittedAppsResults[1].unpermittedApp.versionEnabled);
    }

    function testSetAbilityPolicyParameters_AbilityPolicyNotRegisteredForAppVersion() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
                ABILITY_IPFS_CID_1,
                POLICY_IPFS_CID_3
            )
        );
        vincentUserFacet.setAbilityPolicyParameters(
            FRANK_AGENT_ADDRESS, newAppId, newAppVersion, abilityIpfsCids, _policyIpfsCids, _policyParameterValues
        );
    }

    function testRemoveAbilityPolicyParameters() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First permit the app version
        vm.startPrank(USER_FRANK);
        // Expect events for initial permit
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.NewAgentRegistered(
            USER_FRANK, FRANK_AGENT_ADDRESS, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AppVersionPermitted(
            FRANK_AGENT_ADDRESS, newAppId, newAppVersion, FRANK_PKP_SIGNER, FRANK_PKP_SIGNER_PUB_KEY
        );
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            FRANK_AGENT_ADDRESS,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_1
        );

        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Verify initial policy parameters
        VincentUserViewFacet.AbilityWithPolicies[] memory abilitiesWithPolicies =
            vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(FRANK_AGENT_ADDRESS, newAppId);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(abilitiesWithPolicies[1].policies.length, 0);

        // Create subset arrays containing only the ability and policy we want to zero out
        string[] memory subsetAbilityIpfsCids = new string[](1);
        subsetAbilityIpfsCids[0] = ABILITY_IPFS_CID_1;

        string[][] memory subsetPolicyIpfsCids = new string[][](1);
        subsetPolicyIpfsCids[0] = new string[](1);
        subsetPolicyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory emptyPolicyParameterValues = new bytes[][](1);
        emptyPolicyParameterValues[0] = new bytes[](1);
        emptyPolicyParameterValues[0][0] = bytes(""); // Empty bytes to remove parameter

        // Expect event for setting empty policy parameters
        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            FRANK_AGENT_ADDRESS,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            bytes("")
        );

        // Set empty policy parameters to effectively remove them
        vincentUserFacet.setAbilityPolicyParameters(
            FRANK_AGENT_ADDRESS,
            newAppId,
            newAppVersion,
            subsetAbilityIpfsCids,
            subsetPolicyIpfsCids,
            emptyPolicyParameterValues
        );
        vm.stopPrank();

        // Verify policy parameters are removed
        abilitiesWithPolicies = vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(FRANK_AGENT_ADDRESS, newAppId);
        assertEq(abilitiesWithPolicies.length, 2);
        assertEq(abilitiesWithPolicies[0].policies.length, 1);
        assertEq(abilitiesWithPolicies[0].policies[0].policyParameterValues, bytes("")); // Empty bytes after removal
        assertEq(abilitiesWithPolicies[1].policies.length, 0);

        // Verify ability execution validation returns empty parameters
        VincentUserViewFacet.AbilityExecutionValidation memory abilityExecutionValidation =
            vincentUserViewFacet.validateAbilityExecutionAndGetPolicies(
                APP_DELEGATEE_CHARLIE, FRANK_AGENT_ADDRESS, ABILITY_IPFS_CID_1
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.deleteApp(newAppId);
        vm.stopPrank();

        vm.startPrank(USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppHasBeenDeleted.selector, newAppId));
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
    }

    function testPermitAppVersion_AppNotRegistered() public {
        vm.startPrank(USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppNotRegistered.selector, 1));
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        vm.startPrank(USER_FRANK);
        vm.expectRevert(
            abi.encodeWithSelector(VincentBase.AppVersionNotRegistered.selector, newAppId, newAppVersion + 1)
        );
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // Create arrays with mismatched length

        // Create policy arrays with different length than abilities
        string[][] memory _policyIpfsCids = new string[][](1); // Only 1 policy array for 2 abilities
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory _policyParameterValues = new bytes[][](1); // Only 1 parameter array for 2 abilities
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;

        vm.startPrank(USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AbilitiesAndPoliciesLengthMismatch.selector));
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First permit the app version
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Try to permit the same version again
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentUserFacet.AppVersionAlreadyPermitted.selector, FRANK_AGENT_ADDRESS, newAppId, newAppVersion
            )
        );
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER_2,
            FRANK_PKP_SIGNER_PUB_KEY,
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        vm.startPrank(APP_MANAGER_ALICE);
        vincentAppFacet.enableAppVersion(newAppId, newAppVersion, false);
        vm.stopPrank();

        vm.startPrank(USER_FRANK);
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentUserFacet.AppVersionNotEnabled.selector, newAppId, newAppVersion)
        );
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // Create arrays with only one ability instead of both registered abilities
        string[] memory _abilityIpfsCids = new string[](1);
        _abilityIpfsCids[0] = ABILITY_IPFS_CID_1; // Only providing first ability, missing ABILITY_IPFS_CID_2

        string[][] memory _policyIpfsCids = new string[][](1);
        _policyIpfsCids[0] = new string[](1);
        _policyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory _policyParameterValues = new bytes[][](1);
        _policyParameterValues[0] = new bytes[](1);
        _policyParameterValues[0][0] = POLICY_PARAMETER_VALUES_1;

        vm.startPrank(USER_FRANK);
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentUserFacet.NotAllRegisteredAbilitiesProvided.selector, newAppId, newAppVersion
            )
        );
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // Create arrays with an unregistered ability (ABILITY_IPFS_CID_3)
        string[] memory _abilityIpfsCids = new string[](2);
        _abilityIpfsCids[0] = ABILITY_IPFS_CID_1;
        _abilityIpfsCids[1] = ABILITY_IPFS_CID_3; // This ability is not registered for the app version

        vm.startPrank(USER_FRANK);
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentUserFacet.AbilityNotRegisteredForAppVersion.selector,
                newAppId,
                newAppVersion,
                ABILITY_IPFS_CID_3
            )
        );
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
    function testUnPermitAppVersion_AppNotRegistered() public {
        vm.startPrank(USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppNotRegistered.selector, 1));
        vincentUserFacet.unPermitAppVersion(FRANK_AGENT_ADDRESS, 1, 1);
    }

    function testUnPermitAppVersion_AppVersionNotRegistered() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        vm.startPrank(USER_FRANK);
        vm.expectRevert(
            abi.encodeWithSelector(VincentBase.AppVersionNotRegistered.selector, newAppId, newAppVersion + 1)
        );
        vincentUserFacet.unPermitAppVersion(FRANK_AGENT_ADDRESS, newAppId, newAppVersion + 1);
    }

    function testUnPermitAppVersion_AppVersionNotPermitted() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId_1 = 1;
        uint24 newAppVersion_1 = _registerBasicApp(delegatees);

        delegatees[0] = APP_DELEGATEE_DAVID;
        uint40 newAppId_2 = 2;
        uint24 newAppVersion_2 = _registerBasicApp(delegatees);

        // First permit app 1 to register the agent
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId_1,
            newAppVersion_1,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Now try to unpermit app 2 (which was never permitted)
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentUserFacet.AppVersionNotPermitted.selector, FRANK_AGENT_ADDRESS, newAppId_2, newAppVersion_2
            )
        );
        vincentUserFacet.unPermitAppVersion(FRANK_AGENT_ADDRESS, newAppId_2, newAppVersion_2);
        vm.stopPrank();
    }

    /**
     * ######################### setAbilityPolicyParameters ERROR CASES #########################
     */
    function testSetAbilityPolicyParameters_AppNotRegistered() public {
        vm.startPrank(USER_FRANK);
        vm.expectRevert(abi.encodeWithSelector(VincentBase.AppNotRegistered.selector, 1));
        vincentUserFacet.setAbilityPolicyParameters(
            FRANK_AGENT_ADDRESS, 1, 1, abilityIpfsCids, policyIpfsCids, policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_AppVersionNotRegistered() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        vm.startPrank(USER_FRANK);
        vm.expectRevert(
            abi.encodeWithSelector(VincentBase.AppVersionNotRegistered.selector, newAppId, newAppVersion + 1)
        );
        vincentUserFacet.setAbilityPolicyParameters(
            FRANK_AGENT_ADDRESS,
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
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
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
            FRANK_AGENT_ADDRESS, newAppId, newAppVersion, emptyAbilityIpfsCids, policyIpfsCids, policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_EmptyAbilityIpfsCid() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Create arrays with an empty ability IPFS CID
        string[] memory _abilityIpfsCids = new string[](2);
        _abilityIpfsCids[0] = ""; // Empty string for first ability
        _abilityIpfsCids[1] = ABILITY_IPFS_CID_2;

        vm.expectRevert(abi.encodeWithSelector(VincentUserViewFacet.EmptyAbilityIpfsCid.selector));
        vincentUserFacet.setAbilityPolicyParameters(
            FRANK_AGENT_ADDRESS, newAppId, newAppVersion, _abilityIpfsCids, policyIpfsCids, policyParameterValues
        );
    }

    function testSetAbilityPolicyParameters_NotAllRegisteredAbilitiesProvided() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First permit the app version with valid parameters
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Validate the original ability policies and parameters
        VincentUserViewFacet.AbilityWithPolicies[] memory originalAbilitiesWithPolicies =
            vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(FRANK_AGENT_ADDRESS, newAppId);
        assertEq(originalAbilitiesWithPolicies.length, 2); // Still has both abilities
        assertEq(originalAbilitiesWithPolicies[0].policies.length, 1);
        assertEq(originalAbilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_1);
        assertEq(originalAbilitiesWithPolicies[1].policies.length, 0); // Second ability unchanged

        // Create arrays with only one ability instead of both registered abilities
        string[] memory subsetAbilityIpfsCids = new string[](1);
        subsetAbilityIpfsCids[0] = ABILITY_IPFS_CID_1; // Only providing first ability, missing ABILITY_IPFS_CID_2

        string[][] memory subsetPolicyIpfsCids = new string[][](1);
        subsetPolicyIpfsCids[0] = new string[](1);
        subsetPolicyIpfsCids[0][0] = POLICY_IPFS_CID_1;

        bytes[][] memory subsetPolicyParameterValues = new bytes[][](1);
        subsetPolicyParameterValues[0] = new bytes[](1);
        subsetPolicyParameterValues[0][0] = POLICY_PARAMETER_VALUES_2;

        vm.expectEmit(true, true, true, true);
        emit LibVincentUserFacet.AbilityPolicyParametersSet(
            FRANK_AGENT_ADDRESS,
            newAppId,
            newAppVersion,
            keccak256(abi.encodePacked(ABILITY_IPFS_CID_1)),
            keccak256(abi.encodePacked(POLICY_IPFS_CID_1)),
            POLICY_PARAMETER_VALUES_2
        );

        vincentUserFacet.setAbilityPolicyParameters(
            FRANK_AGENT_ADDRESS,
            newAppId,
            newAppVersion,
            subsetAbilityIpfsCids,
            subsetPolicyIpfsCids,
            subsetPolicyParameterValues
        );

        // Verify the parameters were updated for the first ability only
        VincentUserViewFacet.AbilityWithPolicies[] memory updatedAbilitiesWithPolicies =
            vincentUserViewFacet.getAllAbilitiesAndPoliciesForApp(FRANK_AGENT_ADDRESS, newAppId);
        assertEq(updatedAbilitiesWithPolicies.length, 2); // Still has both abilities
        assertEq(updatedAbilitiesWithPolicies[0].policies.length, 1);
        assertEq(updatedAbilitiesWithPolicies[0].policies[0].policyParameterValues, POLICY_PARAMETER_VALUES_2);
        assertEq(updatedAbilitiesWithPolicies[1].policies.length, 0); // Second ability unchanged
    }

    function testPermitAppVersion_AgentRegisteredToDifferentUser() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First, USER_FRANK registers FRANK_AGENT_ADDRESS
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // Now try to have USER_GEORGE use the same agent address
        vm.startPrank(USER_GEORGE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AgentRegisteredToDifferentUser.selector, USER_FRANK));
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS, // Same agent address
            GEORGE_PKP_SIGNER,
            GEORGE_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();
    }

    function testPermitAppVersion_PkpSignerAlreadyRegisteredToAgent() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // First, register FRANK_AGENT_ADDRESS with FRANK_PKP_SIGNER
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Now try to register a different agent with the same PKP signer
        vm.expectRevert(
            abi.encodeWithSelector(LibVincentUserFacet.PkpSignerAlreadyRegisteredToAgent.selector, FRANK_AGENT_ADDRESS)
        );
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS_2, // Different agent
            FRANK_PKP_SIGNER, // Same PKP signer
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();
    }

    function testUnPermitAppVersion_AgentNotRegisteredToUser() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // USER_FRANK registers FRANK_AGENT_ADDRESS
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // USER_GEORGE tries to unpermit FRANK_AGENT_ADDRESS (which is not registered to them)
        vm.startPrank(USER_GEORGE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AgentNotRegisteredToUser.selector));
        vincentUserFacet.unPermitAppVersion(FRANK_AGENT_ADDRESS, newAppId, newAppVersion);
        vm.stopPrank();
    }

    function testRePermitApp_AgentNotRegisteredToUser() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // USER_FRANK registers and then unpermits FRANK_AGENT_ADDRESS
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vincentUserFacet.unPermitAppVersion(FRANK_AGENT_ADDRESS, newAppId, newAppVersion);
        vm.stopPrank();

        // USER_GEORGE tries to re-permit FRANK_AGENT_ADDRESS (which is not registered to them)
        vm.startPrank(USER_GEORGE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AgentNotRegisteredToUser.selector));
        vincentUserFacet.rePermitApp(FRANK_AGENT_ADDRESS, newAppId);
        vm.stopPrank();
    }

    function testSetAbilityPolicyParameters_AgentNotRegisteredToUser() public {
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_CHARLIE;
        uint40 newAppId = 1;
        uint24 newAppVersion = _registerBasicApp(delegatees);

        // USER_FRANK registers FRANK_AGENT_ADDRESS
        vm.startPrank(USER_FRANK);
        vincentUserFacet.permitAppVersion(
            FRANK_AGENT_ADDRESS,
            FRANK_PKP_SIGNER,
            FRANK_PKP_SIGNER_PUB_KEY,
            newAppId,
            newAppVersion,
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );
        vm.stopPrank();

        // USER_GEORGE tries to set parameters for FRANK_AGENT_ADDRESS
        vm.startPrank(USER_GEORGE);
        vm.expectRevert(abi.encodeWithSelector(LibVincentUserFacet.AgentNotRegisteredToUser.selector));
        vincentUserFacet.setAbilityPolicyParameters(
            FRANK_AGENT_ADDRESS, newAppId, newAppVersion, abilityIpfsCids, policyIpfsCids, policyParameterValues
        );
        vm.stopPrank();
    }

    function _registerApp(address[] memory delegatees, VincentAppFacet.AppVersionAbilities memory versionAbilities)
        private
        returns (uint24)
    {
        vm.startPrank(APP_MANAGER_ALICE);
        (, uint24 newAppVersion,) = vincentAppFacet.registerApp(delegatees, versionAbilities);
        vm.stopPrank();

        return newAppVersion;
    }

    function _registerBasicApp(address[] memory delegatees) private returns (uint24 newAppVersion) {
        VincentAppFacet.AppVersionAbilities memory versionAbilities;
        versionAbilities.abilityIpfsCids = new string[](2);

        versionAbilities.abilityIpfsCids[0] = ABILITY_IPFS_CID_1;
        versionAbilities.abilityIpfsCids[1] = ABILITY_IPFS_CID_2;

        versionAbilities.abilityPolicies = new string[][](2);

        versionAbilities.abilityPolicies[0] = new string[](1);
        versionAbilities.abilityPolicies[0][0] = POLICY_IPFS_CID_1;

        versionAbilities.abilityPolicies[1] = new string[](0);

        return _registerApp(delegatees, versionAbilities);
    }
}
