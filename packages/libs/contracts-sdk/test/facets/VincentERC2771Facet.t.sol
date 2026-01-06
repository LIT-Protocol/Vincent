// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";

import {VincentDiamond} from "../../contracts/VincentDiamond.sol";
import {VincentERC2771Facet} from "../../contracts/facets/VincentERC2771Facet.sol";
import {VincentUserFacet} from "../../contracts/facets/VincentUserFacet.sol";
import {VincentUserViewFacet} from "../../contracts/facets/VincentUserViewFacet.sol";
import {VincentAppFacet} from "../../contracts/facets/VincentAppFacet.sol";
import {LibERC2771} from "../../contracts/libs/LibERC2771.sol";
import {VincentERC2771Storage} from "../../contracts/LibVincentDiamondStorage.sol";

contract VincentERC2771FacetTest is Test {
    VincentDiamond public vincentDiamond;
    VincentERC2771Facet public vincentERC2771Facet;
    VincentUserFacet public vincentUserFacet;
    VincentUserViewFacet public vincentUserViewFacet;
    VincentAppFacet public vincentAppFacet;

    address public owner;
    address public trustedForwarder = makeAddr("TrustedForwarder");
    address public user = makeAddr("User");
    address public otherForwarder = makeAddr("OtherForwarder");

    event TrustedForwarderSet(address indexed newTrustedForwarder);

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));

        // Set a test forwarder address for local testing
        vm.setEnv("VINCENT_GELATO_FORWARDER_ADDRESS", vm.toString(trustedForwarder));

        DeployVincentDiamond deployScript = new DeployVincentDiamond();

        address diamondAddress = deployScript.deployToNetwork("test");
        vincentDiamond = VincentDiamond(payable(diamondAddress));

        vincentERC2771Facet = VincentERC2771Facet(diamondAddress);
        vincentUserFacet = VincentUserFacet(diamondAddress);
        vincentUserViewFacet = VincentUserViewFacet(diamondAddress);
        vincentAppFacet = VincentAppFacet(diamondAddress);

        owner = vm.addr(deployerPrivateKey);
    }

    function _registerBasicApp(uint40 appId, address[] memory delegatees) private returns (uint24 newAppVersion) {
        VincentAppFacet.AppVersionAbilities memory versionAbilities;
        versionAbilities.abilityIpfsCids = new string[](1);
        versionAbilities.abilityIpfsCids[0] = "QmAbility1";

        versionAbilities.abilityPolicies = new string[][](1);
        versionAbilities.abilityPolicies[0] = new string[](0);

        vm.prank(user);
        return vincentAppFacet.registerApp(appId, delegatees, versionAbilities);
    }

    // ============ setTrustedForwarder Tests ============

    function testSetTrustedForwarder() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TrustedForwarderSet(trustedForwarder);
        vincentERC2771Facet.setTrustedForwarder(trustedForwarder);

        assertEq(vincentERC2771Facet.getTrustedForwarder(), trustedForwarder);
    }

    function testSetTrustedForwarderRevertsIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert("LibDiamond: Must be contract owner");
        vincentERC2771Facet.setTrustedForwarder(trustedForwarder);
    }

    function testSetTrustedForwarderRevertsIfZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(VincentERC2771Facet.ZeroAddressNotAllowed.selector);
        vincentERC2771Facet.setTrustedForwarder(address(0));
    }

    function testSetTrustedForwarderCanBeUpdated() public {
        // The forwarder is set during construction, so it should equal the trustedForwarder we passed in
        assertEq(vincentERC2771Facet.getTrustedForwarder(), trustedForwarder);
        assertTrue(vincentERC2771Facet.isTrustedForwarder(trustedForwarder));
        assertFalse(vincentERC2771Facet.isTrustedForwarder(otherForwarder));

        vm.startPrank(owner);
        vincentERC2771Facet.setTrustedForwarder(otherForwarder);
        vm.stopPrank();

        assertEq(vincentERC2771Facet.getTrustedForwarder(), otherForwarder);
        assertTrue(vincentERC2771Facet.isTrustedForwarder(otherForwarder));
        assertFalse(vincentERC2771Facet.isTrustedForwarder(trustedForwarder));
    }

    // ============ EIP-2771 Integration Tests ============

    function testMetaTransactionWithTrustedForwarder() public {
        // Use owner context; trusted forwarder was configured during deployment in setUp()
        vm.prank(owner);

        // Register an app first
        address delegatee = makeAddr("Delegatee");
        address[] memory delegatees = new address[](1);
        delegatees[0] = delegatee;
        _registerBasicApp(1, delegatees);

        // Prepare meta-transaction data
        // In EIP-2771, the real sender is appended to the end of calldata (last 20 bytes)
        address realSender = makeAddr("RealSender");
        address agentAddress = makeAddr("AgentAddress");
        address pkpSigner = makeAddr("PkpSigner");
        uint256 pkpSignerPubKey = 123456789;

        string[] memory abilityIpfsCids = new string[](1);
        abilityIpfsCids[0] = "QmAbility1";

        string[][] memory policyIpfsCids = new string[][](1);
        policyIpfsCids[0] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](1);
        policyParameterValues[0] = new bytes[](0);

        bytes memory permitCalldata = abi.encodeWithSelector(
            VincentUserFacet.permitAppVersion.selector,
            agentAddress,
            pkpSigner,
            pkpSignerPubKey,
            1, // appId
            1, // appVersion
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Append real sender address to calldata (EIP-2771 format)
        bytes memory metaTxCalldata = abi.encodePacked(permitCalldata, realSender);

        // Execute meta-transaction as trusted forwarder
        vm.prank(trustedForwarder);
        (bool success,) = address(vincentUserFacet).call(metaTxCalldata);
        assertTrue(success);

        // Verify that the agent was registered to the real sender, not the forwarder
        address registeredUser = vincentUserViewFacet.getUserAddressForAgent(agentAddress);
        assertEq(registeredUser, realSender, "Agent should be registered to real sender");
    }

    function testDirectCallWithoutForwarder() public {
        // Without setting a trusted forwarder, calls should work normally
        address delegatee = makeAddr("Delegatee");
        address[] memory delegatees = new address[](1);
        delegatees[0] = delegatee;
        _registerBasicApp(1, delegatees);

        address directUser = makeAddr("DirectUser");
        address agentAddress = makeAddr("AgentAddress");
        address pkpSigner = makeAddr("PkpSigner");
        uint256 pkpSignerPubKey = 123456789;

        string[] memory abilityIpfsCids = new string[](1);
        abilityIpfsCids[0] = "QmAbility1";

        string[][] memory policyIpfsCids = new string[][](1);
        policyIpfsCids[0] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](1);
        policyParameterValues[0] = new bytes[](0);

        vm.prank(directUser);
        vincentUserFacet.permitAppVersion(
            agentAddress,
            pkpSigner,
            pkpSignerPubKey,
            1, // appId
            1, // appVersion
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Verify that the agent was registered to the direct caller
        address registeredUser = vincentUserViewFacet.getUserAddressForAgent(agentAddress);
        assertEq(registeredUser, directUser, "Agent should be registered to direct caller");
    }

    function testCallFromNonTrustedForwarderIgnoresAppendedData() public {
        // Set up a trusted forwarder
        vm.prank(owner);
        vincentERC2771Facet.setTrustedForwarder(trustedForwarder);

        // Register an app
        address delegatee = makeAddr("Delegatee");
        address[] memory delegatees = new address[](1);
        delegatees[0] = delegatee;
        _registerBasicApp(1, delegatees);

        // Try to call from a non-trusted forwarder with appended data
        address maliciousForwarder = makeAddr("MaliciousForwarder");
        address fakeSender = makeAddr("FakeSender");
        address agentAddress = makeAddr("AgentAddress");
        address pkpSigner = makeAddr("PkpSigner");
        uint256 pkpSignerPubKey = 123456789;

        string[] memory abilityIpfsCids = new string[](1);
        abilityIpfsCids[0] = "QmAbility1";

        string[][] memory policyIpfsCids = new string[][](1);
        policyIpfsCids[0] = new string[](0);

        bytes[][] memory policyParameterValues = new bytes[][](1);
        policyParameterValues[0] = new bytes[](0);

        bytes memory permitCalldata = abi.encodeWithSelector(
            VincentUserFacet.permitAppVersion.selector,
            agentAddress,
            pkpSigner,
            pkpSignerPubKey,
            1, // appId
            1, // appVersion
            abilityIpfsCids,
            policyIpfsCids,
            policyParameterValues
        );

        // Append fake sender address (but caller is not trusted forwarder)
        bytes memory maliciousCalldata = abi.encodePacked(permitCalldata, fakeSender);

        // Execute as non-trusted forwarder
        vm.prank(maliciousForwarder);
        (bool success,) = address(vincentUserFacet).call(maliciousCalldata);
        assertTrue(success);

        // Verify that the agent was registered to the actual caller (maliciousForwarder),
        // not the appended fake sender
        address registeredUser = vincentUserViewFacet.getUserAddressForAgent(agentAddress);
        assertEq(registeredUser, maliciousForwarder, "Agent should be registered to actual caller");
        assertNotEq(registeredUser, fakeSender, "Agent should NOT be registered to fake sender");
    }

    function testMetaTransactionWithInsufficientCalldataLength() public {
        // Set up trusted forwarder
        vm.prank(owner);
        vincentERC2771Facet.setTrustedForwarder(trustedForwarder);

        // Create calldata that's too short (less than 20 bytes for address)
        bytes memory shortCalldata = abi.encodeWithSelector(VincentERC2771Facet.getTrustedForwarder.selector);

        // Should fall back to using msg.sender when calldata is too short
        vm.prank(trustedForwarder);
        (bool success,) = address(vincentERC2771Facet).call(shortCalldata);
        assertTrue(success);
    }
}
