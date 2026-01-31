// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";
import {TestHelpers} from "../TestHelpers.sol";

import {VincentDiamond} from "../../contracts/VincentDiamond.sol";
import {VincentZeroDevConfigFacet} from "../../contracts/facets/VincentZeroDevConfigFacet.sol";
import {VincentZeroDevStorage} from "../../contracts/LibVincentDiamondStorage.sol";

contract VincentZeroDevConfigFacetTest is TestHelpers {
    VincentDiamond public vincentDiamond;
    VincentZeroDevConfigFacet public vincentZeroDevConfigFacet;

    address public owner;
    address public user = makeAddr("User");
    address public newValidatorAddress = makeAddr("NewECDSAValidator");

    event EcdsaValidatorAddressSet(address indexed previousAddress, address indexed newAddress);

    function setUp() public {
        // Setup the ECDSA validator at the canonical address
        setupECDSAValidator();

        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));

        // Set a test forwarder address for local testing (required by deployment)
        vm.setEnv("VINCENT_GELATO_FORWARDER_ADDRESS", vm.toString(makeAddr("TrustedForwarder")));

        // Set the ECDSA validator address for testing
        vm.setEnv("VINCENT_ECDSA_VALIDATOR_ADDRESS", vm.toString(ECDSA_VALIDATOR_ADDRESS));

        DeployVincentDiamond deployScript = new DeployVincentDiamond();

        address diamondAddress = deployScript.deployToNetwork("test", keccak256("VincentCreate2Salt_2"));
        vincentDiamond = VincentDiamond(payable(diamondAddress));

        vincentZeroDevConfigFacet = VincentZeroDevConfigFacet(diamondAddress);

        owner = vm.addr(deployerPrivateKey);
    }

    // ============ setEcdsaValidatorAddress Tests ============

    function testSetEcdsaValidatorAddress() public {
        // Verify initial address
        assertEq(vincentZeroDevConfigFacet.getEcdsaValidatorAddress(), ECDSA_VALIDATOR_ADDRESS);

        // Set new address as owner
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit EcdsaValidatorAddressSet(ECDSA_VALIDATOR_ADDRESS, newValidatorAddress);
        vincentZeroDevConfigFacet.setEcdsaValidatorAddress(newValidatorAddress);

        // Verify update
        assertEq(vincentZeroDevConfigFacet.getEcdsaValidatorAddress(), newValidatorAddress);
    }

    function testSetEcdsaValidatorAddressRevertsIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert("LibDiamond: Must be contract owner");
        vincentZeroDevConfigFacet.setEcdsaValidatorAddress(newValidatorAddress);
    }

    function testSetEcdsaValidatorAddressRevertsForZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(VincentZeroDevConfigFacet.ZeroAddressNotAllowed.selector);
        vincentZeroDevConfigFacet.setEcdsaValidatorAddress(address(0));
    }
}
