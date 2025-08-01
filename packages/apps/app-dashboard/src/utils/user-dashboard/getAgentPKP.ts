import { IRelayPKP } from '@lit-protocol/types';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { SELECTED_LIT_NETWORK } from './lit';

/**
 * Get Agent PKP for a user address
 *
 * Finds an Agent PKP owned by the user that is different from their current PKP.
 * This is used for connect delegation and other agent-related operations.
 *
 * @param userAddress The ETH address of the user's current PKP
 * @returns Promise<IRelayPKP> The Agent PKP details, or null if none found
 * @throws Error if no Agent PKP is found or if there's an issue with the contract calls
 */
export async function getAgentPKP(userAddress: string): Promise<IRelayPKP> {
  try {
    const pkpNftContract = getPkpNftContract(SELECTED_LIT_NETWORK);

    const balance = await pkpNftContract.balanceOf(userAddress);
    if (balance.toNumber() === 0) {
      throw new Error('No PKPs found for this user');
    }

    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await pkpNftContract.tokenOfOwnerByIndex(userAddress, i);
      const publicKey = await pkpNftContract.getPubkey(tokenId);
      const ethAddress = await pkpNftContract.getEthAddress(tokenId);

      if (ethAddress.toLowerCase() === userAddress.toLowerCase()) {
        continue;
      }

      return {
        tokenId: tokenId.toString(),
        publicKey,
        ethAddress,
      };
    }

    // If we've gone through all PKPs and haven't found an Agent PKP
    throw new Error(
      'No Agent PKP found for this user. The user needs a second PKP to act as an agent.',
    );
  } catch (error) {
    // Rethrow with a more descriptive message if it's not already an Error
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to get Agent PKP: ${error}`);
    }
  }
}
