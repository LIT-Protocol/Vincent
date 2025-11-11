// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {VincentAppFacet} from "../../contracts/facets/VincentAppFacet.sol";
import {TestCommon} from "../TestCommon.sol";
import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";
import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";
import {MockPKPNftFacet} from "../mocks/MockPKPNftFacet.sol";
import {FeeUtils} from "../../contracts/fees/FeeUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract FeeTestCommon is TestCommon {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    function _deployFeeDiamond(address vincentDiamondAddress) public returns (address) {
        DeployFeeDiamond deployScript = new DeployFeeDiamond();
        address diamondAddress = deployScript.deployToNetwork("test", keccak256("testSalt"), vincentDiamondAddress);
        return diamondAddress;
    }

    function _deployVincentDiamondAndBasicApp(address appManager, address appDelegatee, uint40 appId)
        public
        returns (address)
    {
        DeployVincentDiamond vincentDeployScript = new DeployVincentDiamond();
        MockPKPNftFacet mockPkpNft = new MockPKPNftFacet();

        address diamondAddress = vincentDeployScript.deployToNetwork("test", address(mockPkpNft));
        VincentAppFacet vincentAppFacet = VincentAppFacet(diamondAddress);

        // register the app
        vm.startPrank(appManager);
        address[] memory delegatees = new address[](1);
        delegatees[0] = appDelegatee;
        vincentAppFacet.registerApp(
            appId, delegatees, _createBasicVersionAbilities("QmAbility1", "QmAbility2", "QmPolicy1")
        );
        vm.stopPrank();

        return diamondAddress;
    }

    /**
     * Mock implementation of owner attestation signing for testing.
     * 
     * In production, this should be replaced by calling the Lit Action via the
     * signOwnerAttestation function in @lit-protocol/vincent-contracts-sdk.
     * 
     * The Lit Action:
     * 1. Reads from the Vincent Diamond contract on Chronicle Yellowstone to verify ownership
     * 2. Creates the OwnerAttestation structure
     * 3. Signs it using a PKP
     * 
     * @param oa The owner attestation to sign
     * @param ownerAttestationSignerPrivateKey Private key for testing (in production, use PKP via Lit Action)
     * @return signature The signature bytes in r, s, v format
     * 
     * @dev See packages/libs/contracts-sdk/src/fees/signOwnerAttestation.ts for the real implementation
     * @dev See packages/libs/contracts-sdk/lit-actions/ for the Lit Action source code
     */
    function _signOwnerAttestation(FeeUtils.OwnerAttestation memory oa, uint256 ownerAttestationSignerPrivateKey)
        public
        pure
        returns (bytes memory)
    {
        bytes32 message = keccak256(
            abi.encodePacked(
                oa.srcChainId,
                oa.srcContract,
                oa.owner,
                oa.appId,
                oa.issuedAt,
                oa.expiresAt,
                oa.dstChainId,
                oa.dstContract
            )
        );
        bytes32 messageHash = message.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerAttestationSignerPrivateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v); // note the order here is different from line above.
        return signature;
    }
}
