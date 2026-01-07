import type { BigNumber, BigNumberish, Signer } from 'ethers';

import { ethers } from 'ethers';

const DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475';
const PUBKEY_ROUTER_ABI = [
  'function ethAddressToPkpId(address ethAddress) public view returns (uint256)',
  'function getEthAddress(uint256 tokenId) public view returns (address)',
];

// FIXME: Use the js-sdk contracts-sdk instead, once we get tree-shaking under control.
// FIXME: Right now, importing the contracts-sdk would make _every_ vincent ability and policy LA import all network ABIs which is multiple-MBs of source

/**
 * Get the PKP token ID for a given PKP Ethereum address
 * @param pkpEthAddress - The Ethereum address of the PKP
 * @param signer ethers signer for the LIT chain
 * @returns The PKP token ID as a number
 */
export async function getPkpTokenId({
  pkpEthAddress,
  signer,
}: {
  pkpEthAddress: string;
  signer: Signer;
}): Promise<BigNumber> {
  if (!ethers.utils.isAddress(pkpEthAddress)) {
    throw new Error(`Invalid Ethereum address: ${pkpEthAddress}`);
  }

  const pubkeyRouter = new ethers.Contract(
    DATIL_PUBKEY_ROUTER_ADDRESS,
    PUBKEY_ROUTER_ABI,
    signer.provider,
  );

  return await pubkeyRouter.ethAddressToPkpId(pkpEthAddress);
}

/**
 * Get the PKP Ethereum address for a given PKP token ID
 * @param tokenId - The token ID of the PKP
 * @param signer ethers signer for the LIT chain
 * @returns The PKP Ethereum address
 */
export async function getPkpEthAddress({
  tokenId,
  signer,
}: {
  tokenId: BigNumberish;
  signer: Signer;
}): Promise<string> {
  // Convert tokenId to BigNumber if it's not already
  const tokenIdBN = ethers.BigNumber.from(tokenId);

  // Validate tokenId
  if (tokenIdBN.isZero()) {
    throw new Error('Invalid token ID: Token ID cannot be zero');
  }

  const pubkeyRouter = new ethers.Contract(
    DATIL_PUBKEY_ROUTER_ADDRESS,
    PUBKEY_ROUTER_ABI,
    signer.provider,
  );

  return await pubkeyRouter.getEthAddress(tokenIdBN);
}
