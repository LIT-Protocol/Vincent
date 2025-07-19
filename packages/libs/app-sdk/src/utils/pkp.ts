import type { ethers } from 'ethers';

import { getPubKeyRouterContract } from './contracts';

/**
 * Retrieves PKP Eth Address
 *
 * This function queries the PKP Router contract to get the Ethereum address
 * associated with a PKP token ID.
 *
 * @param pkpTokenId - The PKP token ID as ethers.BigNumber
 * @returns The PKP Eth address
 */
export async function getPkpEthAddress(pkpTokenId: ethers.BigNumber): Promise<string> {
  const pubkeyRouter = getPubKeyRouterContract();

  return await pubkeyRouter.getEthAddress(pkpTokenId);
}
