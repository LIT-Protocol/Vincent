import { ethers } from 'ethers';

declare const Lit: {
  Actions: {
    signAsAction: (params: {
      toSign: Uint8Array;
      signingScheme: string;
      sigName: string;
    }) => Promise<string>;
  };
};

export interface OwnerAttestation {
  srcChainId: number;
  srcContract: string;
  owner: string;
  appId: number;
  issuedAt: number;
  expiresAt: number;
  dstChainId: number;
  dstContract: string;
}

/**
 * Signs an owner attestation using the PKP
 * This replicates the Solidity signing logic from FeeTestCommon.sol
 *
 * @param oa - The owner attestation to sign
 * @param pkpPublicKey - The PKP public key (with 0x prefix)
 * @returns The signature bytes in r, s, v format
 */
export async function signOwnerAttestation(
  oa: OwnerAttestation,
  pkpPublicKey: string,
): Promise<string> {
  // Remove 0x prefix if it exists, Lit expects a hex string without 0x prefix
  const publicKeyForLit = pkpPublicKey.replace(/^0x/, '');
  console.log(`Signing owner attestation using PKP Public Key: ${publicKeyForLit}`);

  // Encode the message using abi.encodePacked equivalent
  // In ethers v5, we use solidityPack for abi.encodePacked
  const packed = ethers.utils.solidityPack(
    ['uint256', 'address', 'address', 'uint40', 'uint256', 'uint256', 'uint256', 'address'],
    [
      oa.srcChainId,
      oa.srcContract,
      oa.owner,
      oa.appId,
      oa.issuedAt,
      oa.expiresAt,
      oa.dstChainId,
      oa.dstContract,
    ],
  );

  // Hash the packed data
  const message = ethers.utils.keccak256(packed);
  console.log('Message hash:', message);

  // Convert to Ethereum signed message hash (adds "\x19Ethereum Signed Message:\n32")
  const messageHash = ethers.utils.hashMessage(ethers.utils.arrayify(message));
  console.log('Ethereum signed message hash:', messageHash);

  // Sign using Lit PKP
  const signatureResponse = await Lit.Actions.signAsAction({
    toSign: ethers.utils.arrayify(messageHash),
    signingScheme: 'EcdsaK256Sha256',
    sigName: 'ownerAttestation',
  });

  const { r, s, v } = JSON.parse(signatureResponse);

  // Return signature in r, s, v format (65 bytes total)
  // This matches the Solidity: abi.encodePacked(r, s, v)
  const signature = ethers.utils.solidityPack(['bytes32', 'bytes32', 'uint8'], [r, s, v]);

  console.log('Signature:', signature);
  return signature;
}
