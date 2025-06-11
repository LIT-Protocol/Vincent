import { ethers } from 'ethers';

import { LIT_NETWORK } from '@lit-protocol/constants';

import { getContract } from './contracts';

/**
 * Retrieves information about a PKP token
 *
 * This function queries the PKP Router contract to get the Ethereum address
 * and public key associated with a PKP token ID.
 *
 * @param pkpTokenId - The PKP token ID as ethers.BigNumber
 * @returns An object containing the token ID (as a hex string), Ethereum address, and public key
 */
export async function getPkpInfo(pkpTokenId: ethers.BigNumber): Promise<{
  tokenId: string;
  ethAddress: string;
  publicKey: string;
}> {
  const pubkeyRouter = getContract(LIT_NETWORK.Datil, 'PubKeyRouter');

  const [ethAddress, publicKey] = await Promise.all([
    pubkeyRouter.getEthAddress(pkpTokenId),
    pubkeyRouter.getPubkey(pkpTokenId),
  ]);

  return {
    tokenId: pkpTokenId.toHexString(),
    ethAddress,
    publicKey,
  };
}
