// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VincentAppRegistry} from "../../src/VincentAppRegistry.sol";
import {VincentTypes} from "../../src/VincentTypes.sol";

contract VincentAppRegistryTest is Test {
    VincentAppRegistry public registry;
    address public manager;
    address public delegatee;
    address public otherAccount;

    // Test data
    string constant TOOL_IPFS_CID = "QmTesting123";
    string constant PARAMETER_NAME = "apiKey";
    bytes32 public toolIpfsCidHash;
    bytes32 public parameterNameHash;

    function setUp() public virtual {
        registry = new VincentAppRegistry();
        manager = makeAddr("manager");
        delegatee = makeAddr("delegatee");
        otherAccount = makeAddr("otherAccount");

        toolIpfsCidHash = keccak256(abi.encodePacked(TOOL_IPFS_CID));
        parameterNameHash = keccak256(abi.encodePacked(PARAMETER_NAME));

        vm.label(address(registry), "VincentAppRegistry");
        vm.label(manager, "Manager");
        vm.label(delegatee, "Delegatee");
        vm.label(otherAccount, "OtherAccount");
    }

    // Helper function to register an app and return its ID
    function _registerApp(address appManager) internal returns (uint256) {
        vm.prank(appManager);
        return registry.registerApp();
    }

    // Helper function to register a role and return its ID
    function _registerRole(
        uint256 appId,
        string memory name,
        string memory description,
        string[] memory toolIpfsCids,
        string[][] memory parameterNames
    ) internal returns (uint256) {
        vm.startPrank(registry.getAppManager(appId));
        uint256 roleId = registry.registerRole(appId, name, description, toolIpfsCids, parameterNames);
        vm.stopPrank();
        return roleId;
    }

    // Helper function to create a basic role with one tool
    function _createBasicRole()
        internal
        pure
        returns (
            string memory name,
            string memory description,
            string[] memory toolIpfsCids,
            string[][] memory parameterNames
        )
    {
        name = "TestRole";
        description = "Test Role Description";

        toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        parameterNames = new string[][](1);
        parameterNames[0] = new string[](1);
        parameterNames[0][0] = PARAMETER_NAME;
    }
}
