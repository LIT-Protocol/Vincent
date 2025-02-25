// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VincentUserRegistry} from "../../src/VincentUserRegistry.sol";
import {VincentAppRegistry} from "../../src/VincentAppRegistry.sol";
import {IPKPNFTFacet} from "../../src/IPKPNftFacet.sol";
import {MockPKPNFT} from "./mocks/MockPKPNFT.sol";

contract VincentUserRegistryTest is Test {
    VincentUserRegistry public registry;
    VincentAppRegistry public appRegistry;
    MockPKPNFT public pkpNft;

    address public owner;
    address public otherAccount;
    uint256 public pkpTokenId;

    // Test data
    string constant TOOL_IPFS_CID = "QmTesting123";
    string constant PARAMETER_NAME = "apiKey";
    string constant PARAMETER_VALUE = "test-value";
    bytes32 public toolIpfsCidHash;
    bytes32 public parameterNameHash;

    function setUp() public virtual {
        owner = makeAddr("owner");
        otherAccount = makeAddr("otherAccount");
        pkpTokenId = 1;

        // Deploy contracts
        appRegistry = new VincentAppRegistry();
        pkpNft = new MockPKPNFT();
        registry = new VincentUserRegistry(address(appRegistry), address(pkpNft));

        // Setup PKP ownership
        vm.prank(owner);
        pkpNft.mint(owner, pkpTokenId);

        // Setup hashes
        toolIpfsCidHash = keccak256(abi.encodePacked(TOOL_IPFS_CID));
        parameterNameHash = keccak256(abi.encodePacked(PARAMETER_NAME));

        // Label addresses for better trace output
        vm.label(address(registry), "VincentUserRegistry");
        vm.label(address(appRegistry), "VincentAppRegistry");
        vm.label(address(pkpNft), "PKP NFT");
        vm.label(owner, "Owner");
        vm.label(otherAccount, "OtherAccount");
    }

    // Helper function to register and enable an app
    function _registerAndEnableApp() internal returns (uint256 appId) {
        appId = appRegistry.registerApp();
        appRegistry.enableApp(appId);
    }

    // Helper function to register a role with a tool
    function _registerRole(uint256 appId) internal virtual returns (uint256 roleId) {
        string memory name = "TestRole";
        string memory description = "Test Role Description";

        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        string[][] memory parameterNames = new string[][](1);
        parameterNames[0] = new string[](1);
        parameterNames[0][0] = PARAMETER_NAME;

        roleId = appRegistry.registerRole(appId, name, description, toolIpfsCids, parameterNames);
    }

    // Helper function to setup a complete app with role and tool
    function _setupAppWithRole() internal returns (uint256 appId, uint256 roleId) {
        appId = _registerAndEnableApp();
        roleId = _registerRole(appId);
    }
}
