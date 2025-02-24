// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {VincentAppRegistry} from "../src/VincentAppRegistry.sol";
import {IPKPNFTFacet} from "../src/interfaces/IPKPNFTFacet.sol";

contract MockPKPNFTFacet is IPKPNFTFacet {
    mapping(uint256 => address) private _owners;

    function setOwner(uint256 tokenId, address owner) external {
        _owners[tokenId] = owner;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "PKP: nonexistent token");
        return _owners[tokenId];
    }
}

contract VincentAppRegistryTest is Test {
    VincentAppRegistry public registry;
    MockPKPNFTFacet public pkpNFT;

    address public constant APP_MANAGER = address(0x1);
    address public constant DELEGATEE = address(0x2);
    address public constant PKP_OWNER = address(0x3);
    uint256 public constant PKP_TOKEN_ID = 1;

    event DelegateeAdded(address indexed appManager, address indexed delegatee);
    event DelegateeRemoved(address indexed appManager, address indexed delegatee);
    event AppPermitted(address indexed appManager, uint256 indexed agentPkpTokenId);
    event AppUnpermitted(address indexed appManager, uint256 indexed agentPkpTokenId);

    function setUp() public {
        pkpNFT = new MockPKPNFTFacet();
        registry = new VincentAppRegistry(address(pkpNFT));

        // Set up initial state
        vm.prank(PKP_OWNER);
        pkpNFT.setOwner(PKP_TOKEN_ID, PKP_OWNER);
    }

    // ======================== Constructor Tests ========================

    function testConstructorZeroAddress() public {
        vm.expectRevert("VincentAgentRegistry: zero address");
        new VincentAppRegistry(address(0));
    }

    // ======================== Delegatee Tests ========================

    function testAddDelegatee() public {
        vm.startPrank(APP_MANAGER);

        vm.expectEmit(true, true, false, false);
        emit DelegateeAdded(APP_MANAGER, DELEGATEE);

        registry.addDelegatee(DELEGATEE);
        assertTrue(registry.isDelegatee(APP_MANAGER, DELEGATEE));
        vm.stopPrank();
    }

    function testAddDelegateeZeroAddress() public {
        vm.prank(APP_MANAGER);
        vm.expectRevert("VincentAppRegistry: zero address");
        registry.addDelegatee(address(0));
    }

    function testAddDelegateeDuplicate() public {
        vm.startPrank(APP_MANAGER);
        registry.addDelegatee(DELEGATEE);

        vm.expectRevert("VincentAppRegistry: delegatee already exists");
        registry.addDelegatee(DELEGATEE);
        vm.stopPrank();
    }

    function testAddDelegateeToSelf() public {
        vm.prank(APP_MANAGER);
        registry.addDelegatee(APP_MANAGER);
        assertTrue(registry.isDelegatee(APP_MANAGER, APP_MANAGER));
    }

    function testAddMultipleDelegatees() public {
        address[] memory delegatees = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            delegatees[i] = address(uint160(0x1000 + i));
            vm.prank(APP_MANAGER);
            registry.addDelegatee(delegatees[i]);
            assertTrue(registry.isDelegatee(APP_MANAGER, delegatees[i]));
        }

        address[] memory storedDelegatees = registry.getDelegatees(APP_MANAGER);
        assertEq(storedDelegatees.length, 5);
    }

    function testRemoveDelegatee() public {
        vm.startPrank(APP_MANAGER);
        registry.addDelegatee(DELEGATEE);

        vm.expectEmit(true, true, false, false);
        emit DelegateeRemoved(APP_MANAGER, DELEGATEE);

        registry.removeDelegatee(DELEGATEE);
        assertFalse(registry.isDelegatee(APP_MANAGER, DELEGATEE));
        vm.stopPrank();
    }

    function testRemoveDelegateeNonexistent() public {
        vm.prank(APP_MANAGER);
        vm.expectRevert("VincentAppRegistry: delegatee does not exist");
        registry.removeDelegatee(DELEGATEE);
    }

    function testRemoveAllDelegatees() public {
        address[] memory delegatees = new address[](5);
        vm.startPrank(APP_MANAGER);

        // Add delegatees
        for (uint256 i = 0; i < 5; i++) {
            delegatees[i] = address(uint160(0x1000 + i));
            registry.addDelegatee(delegatees[i]);
        }

        // Remove all delegatees
        for (uint256 i = 0; i < 5; i++) {
            registry.removeDelegatee(delegatees[i]);
            assertFalse(registry.isDelegatee(APP_MANAGER, delegatees[i]));
        }

        address[] memory remainingDelegatees = registry.getDelegatees(APP_MANAGER);
        assertEq(remainingDelegatees.length, 0);
        vm.stopPrank();
    }

    function testGetDelegatees() public {
        address delegatee2 = address(0x4);

        vm.startPrank(APP_MANAGER);
        registry.addDelegatee(DELEGATEE);
        registry.addDelegatee(delegatee2);

        address[] memory delegatees = registry.getDelegatees(APP_MANAGER);
        assertEq(delegatees.length, 2);
        assertTrue(delegatees[0] == DELEGATEE || delegatees[1] == DELEGATEE);
        assertTrue(delegatees[0] == delegatee2 || delegatees[1] == delegatee2);
        vm.stopPrank();
    }

    function testGetDelegateesEmpty() public view {
        address[] memory delegatees = registry.getDelegatees(APP_MANAGER);
        assertEq(delegatees.length, 0);
    }

    // ======================== PKP Permission Tests ========================

    function testPermitAppForAgentPkp() public {
        vm.prank(PKP_OWNER);

        vm.expectEmit(true, true, false, false);
        emit AppPermitted(APP_MANAGER, PKP_TOKEN_ID);

        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        assertTrue(registry.isAppPermittedForAgentPkp(APP_MANAGER, PKP_TOKEN_ID));
    }

    function testPermitAppForAgentPkpNotOwner() public {
        vm.prank(APP_MANAGER);
        vm.expectRevert("VincentAppRegistry: not PKP owner");
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
    }

    function testPermitAppForAgentPkpDuplicate() public {
        vm.startPrank(PKP_OWNER);
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);

        vm.expectRevert("VincentAppRegistry: agent PKP already permitted for app");
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        vm.stopPrank();
    }

    function testPermitMultipleAppsForAgentPkp() public {
        address[] memory apps = new address[](5);
        vm.startPrank(PKP_OWNER);

        for (uint256 i = 0; i < 5; i++) {
            apps[i] = address(uint160(0x1000 + i));
            registry.permitAppForAgentPkp(apps[i], PKP_TOKEN_ID);
            assertTrue(registry.isAppPermittedForAgentPkp(apps[i], PKP_TOKEN_ID));
        }
        vm.stopPrank();
    }

    function testPermitAppForMultipleAgentPkps() public {
        uint256[] memory pkpTokenIds = new uint256[](5);
        vm.startPrank(PKP_OWNER);

        for (uint256 i = 0; i < 5; i++) {
            pkpTokenIds[i] = i + 1;
            pkpNFT.setOwner(pkpTokenIds[i], PKP_OWNER);
            registry.permitAppForAgentPkp(APP_MANAGER, pkpTokenIds[i]);
            assertTrue(registry.isAppPermittedForAgentPkp(APP_MANAGER, pkpTokenIds[i]));
        }

        uint256[] memory permittedPkps = registry.getPermittedAgentPkpsForApp(APP_MANAGER);
        assertEq(permittedPkps.length, 5);
        vm.stopPrank();
    }

    function testUnpermitAppForAgentPkp() public {
        vm.startPrank(PKP_OWNER);
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);

        vm.expectEmit(true, true, false, false);
        emit AppUnpermitted(APP_MANAGER, PKP_TOKEN_ID);

        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        assertFalse(registry.isAppPermittedForAgentPkp(APP_MANAGER, PKP_TOKEN_ID));
        vm.stopPrank();
    }

    function testUnpermitAppForAgentPkpNotOwner() public {
        vm.prank(APP_MANAGER);
        vm.expectRevert("VincentAppRegistry: not PKP owner");
        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
    }

    function testUnpermitAppForAgentPkpNonexistent() public {
        vm.prank(PKP_OWNER);
        vm.expectRevert("VincentAppRegistry: agent PKP not permitted for app");
        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
    }

    function testUnpermitAllAppsForAgentPkp() public {
        address[] memory apps = new address[](5);
        vm.startPrank(PKP_OWNER);

        // Permit apps
        for (uint256 i = 0; i < 5; i++) {
            apps[i] = address(uint160(0x1000 + i));
            registry.permitAppForAgentPkp(apps[i], PKP_TOKEN_ID);
        }

        // Unpermit all apps
        for (uint256 i = 0; i < 5; i++) {
            registry.unpermitAppForAgentPkp(apps[i], PKP_TOKEN_ID);
            assertFalse(registry.isAppPermittedForAgentPkp(apps[i], PKP_TOKEN_ID));
        }
        vm.stopPrank();
    }

    function testGetPermittedAgentPkpsForApp() public {
        uint256 pkpTokenId2 = 2;
        vm.prank(PKP_OWNER);
        pkpNFT.setOwner(pkpTokenId2, PKP_OWNER);

        vm.startPrank(PKP_OWNER);
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        registry.permitAppForAgentPkp(APP_MANAGER, pkpTokenId2);

        uint256[] memory pkps = registry.getPermittedAgentPkpsForApp(APP_MANAGER);
        assertEq(pkps.length, 2);
        assertTrue(pkps[0] == PKP_TOKEN_ID || pkps[1] == PKP_TOKEN_ID);
        assertTrue(pkps[0] == pkpTokenId2 || pkps[1] == pkpTokenId2);
        vm.stopPrank();
    }

    function testGetPermittedAgentPkpsForAppEmpty() public view {
        uint256[] memory pkps = registry.getPermittedAgentPkpsForApp(APP_MANAGER);
        assertEq(pkps.length, 0);
    }

    function testPermitAfterUnpermit() public {
        vm.startPrank(PKP_OWNER);

        // First permit
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        assertTrue(registry.isAppPermittedForAgentPkp(APP_MANAGER, PKP_TOKEN_ID));

        // Then unpermit
        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        assertFalse(registry.isAppPermittedForAgentPkp(APP_MANAGER, PKP_TOKEN_ID));

        // Permit again
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        assertTrue(registry.isAppPermittedForAgentPkp(APP_MANAGER, PKP_TOKEN_ID));
        vm.stopPrank();
    }

    function testPkpOwnershipTransfer() public {
        // Initial permit by first owner
        vm.prank(PKP_OWNER);
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);

        // Transfer PKP ownership
        address newOwner = address(0x1234);
        vm.prank(PKP_OWNER);
        pkpNFT.setOwner(PKP_TOKEN_ID, newOwner);

        // Try operations with old owner
        vm.startPrank(PKP_OWNER);
        vm.expectRevert("VincentAppRegistry: not PKP owner");
        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        vm.stopPrank();

        // Try operations with new owner
        vm.startPrank(newOwner);
        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        assertFalse(registry.isAppPermittedForAgentPkp(APP_MANAGER, PKP_TOKEN_ID));
        vm.stopPrank();
    }

    function testPermitAppForNonexistentPkp() public {
        uint256 nonexistentPkpId = 999;
        vm.expectRevert("PKP: nonexistent token");
        vm.prank(PKP_OWNER);
        registry.permitAppForAgentPkp(APP_MANAGER, nonexistentPkpId);
    }

    function testAddDelegateeWithMaxValue() public {
        vm.startPrank(APP_MANAGER);
        address maxAddress = address(uint160(type(uint160).max));
        registry.addDelegatee(maxAddress);
        assertTrue(registry.isDelegatee(APP_MANAGER, maxAddress));
        vm.stopPrank();
    }

    function testEventParameterAccuracy() public {
        vm.startPrank(APP_MANAGER);

        // Test DelegateeAdded event parameters
        vm.expectEmit(true, true, false, false);
        emit DelegateeAdded(APP_MANAGER, DELEGATEE);
        registry.addDelegatee(DELEGATEE);

        // Test DelegateeRemoved event parameters
        vm.expectEmit(true, true, false, false);
        emit DelegateeRemoved(APP_MANAGER, DELEGATEE);
        registry.removeDelegatee(DELEGATEE);
        vm.stopPrank();

        // Test AppPermitted event parameters
        vm.startPrank(PKP_OWNER);
        vm.expectEmit(true, true, false, false);
        emit AppPermitted(APP_MANAGER, PKP_TOKEN_ID);
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);

        // Test AppUnpermitted event parameters
        vm.expectEmit(true, true, false, false);
        emit AppUnpermitted(APP_MANAGER, PKP_TOKEN_ID);
        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
        vm.stopPrank();
    }

    function testConcurrentDelegateeOperations() public {
        address[] memory delegatees = new address[](3);
        delegatees[0] = address(0x1111);
        delegatees[1] = address(0x2222);
        delegatees[2] = address(0x3333);

        // Add multiple delegatees in sequence
        vm.startPrank(APP_MANAGER);
        for (uint256 i = 0; i < delegatees.length; i++) {
            registry.addDelegatee(delegatees[i]);
        }

        // Remove first and last delegatee
        registry.removeDelegatee(delegatees[0]);
        registry.removeDelegatee(delegatees[2]);

        // Add new delegatee
        address newDelegatee = address(0x4444);
        registry.addDelegatee(newDelegatee);

        // Verify final state
        address[] memory finalDelegatees = registry.getDelegatees(APP_MANAGER);
        assertEq(finalDelegatees.length, 2);
        assertTrue(registry.isDelegatee(APP_MANAGER, delegatees[1]));
        assertTrue(registry.isDelegatee(APP_MANAGER, newDelegatee));
        vm.stopPrank();
    }

    function testConcurrentPkpOperations() public {
        uint256[] memory pkpIds = new uint256[](3);
        pkpIds[0] = 1;
        pkpIds[1] = 2;
        pkpIds[2] = 3;

        vm.startPrank(PKP_OWNER);
        // Set up PKPs
        for (uint256 i = 0; i < pkpIds.length; i++) {
            pkpNFT.setOwner(pkpIds[i], PKP_OWNER);
        }

        // Permit multiple PKPs
        for (uint256 i = 0; i < pkpIds.length; i++) {
            registry.permitAppForAgentPkp(APP_MANAGER, pkpIds[i]);
        }

        // Unpermit first and last PKP
        registry.unpermitAppForAgentPkp(APP_MANAGER, pkpIds[0]);
        registry.unpermitAppForAgentPkp(APP_MANAGER, pkpIds[2]);

        // Permit first PKP again
        registry.permitAppForAgentPkp(APP_MANAGER, pkpIds[0]);

        // Verify final state
        uint256[] memory finalPkps = registry.getPermittedAgentPkpsForApp(APP_MANAGER);
        assertEq(finalPkps.length, 2);
        assertTrue(registry.isAppPermittedForAgentPkp(APP_MANAGER, pkpIds[0]));
        assertTrue(registry.isAppPermittedForAgentPkp(APP_MANAGER, pkpIds[1]));
        assertFalse(registry.isAppPermittedForAgentPkp(APP_MANAGER, pkpIds[2]));
        vm.stopPrank();
    }

    function testPkpOwnershipEdgeCases() public {
        // Test with zero address owner
        uint256 newPkpId = 999;
        vm.prank(PKP_OWNER);
        vm.expectRevert("PKP: nonexistent token");
        registry.permitAppForAgentPkp(APP_MANAGER, newPkpId);

        // Test with multiple ownership transfers
        vm.startPrank(PKP_OWNER);
        registry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);

        address newOwner1 = address(0x1234);
        pkpNFT.setOwner(PKP_TOKEN_ID, newOwner1);
        vm.stopPrank();

        vm.prank(newOwner1);
        address newOwner2 = address(0x5678);
        pkpNFT.setOwner(PKP_TOKEN_ID, newOwner2);

        vm.prank(newOwner2);
        registry.unpermitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);

        assertFalse(registry.isAppPermittedForAgentPkp(APP_MANAGER, PKP_TOKEN_ID));
    }
}
