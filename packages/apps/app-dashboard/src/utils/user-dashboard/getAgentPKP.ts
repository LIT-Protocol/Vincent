import { IRelayPKP } from '@lit-protocol/types';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { SELECTED_LIT_NETWORK } from './lit';
import { readOnlySigner } from '../developer-dashboard/readOnlySigner';

// Type for mapping appId to agent PKPs
export type AgentPKPMap = Record<number, IRelayPKP>;

/**
 * Get all Agent PKPs for a user address as a map
 *
 * Finds all Agent PKPs owned by the user that are different from their current PKP.
 * Creates a map where the appId is the key and the PKP object is the value.
 * Each PKP should only have one appId.
 *
 * @param userAddress The ETH address of the user's current PKP
 * @returns Promise<AgentPKPMap> Map of appId to Agent PKP details
 * @throws Error if there's an issue with the contract calls
 */
export async function getAgentPKPs(userAddress: string): Promise<AgentPKPMap> {
  try {
    console.log('[getAgentPKPs] Starting for userAddress:', userAddress);
    const pkpNftContract = getPkpNftContract(SELECTED_LIT_NETWORK);
    const client = getClient({ signer: readOnlySigner });

    const balance = await pkpNftContract.balanceOf(userAddress);
    console.log('[getAgentPKPs] PKP balance:', balance.toNumber());
    if (balance.toNumber() === 0) {
      console.log('[getAgentPKPs] No PKPs found, returning empty map');
      return {};
    }

    const balanceNum = balance.toNumber();

    // First, get all token IDs in parallel
    const tokenIdPromises = Array.from({ length: balanceNum }, (_, i) =>
      pkpNftContract.tokenOfOwnerByIndex(userAddress, i),
    );
    const tokenIds = await Promise.all(tokenIdPromises);
    console.log(
      '[getAgentPKPs] Token IDs:',
      tokenIds.map((id) => id.toString()),
    );

    // Then, get all public keys and eth addresses in parallel
    const pkpDataPromises = tokenIds.map(async (tokenId) => {
      const [publicKey, ethAddress] = await Promise.all([
        pkpNftContract.getPubkey(tokenId),
        pkpNftContract.getEthAddress(tokenId),
      ]);

      return {
        tokenId: tokenId.toString(),
        publicKey,
        ethAddress,
      };
    });

    const allPKPs = await Promise.all(pkpDataPromises);
    console.log(
      '[getAgentPKPs] All PKPs:',
      allPKPs.map((pkp) => ({ tokenId: pkp.tokenId, ethAddress: pkp.ethAddress })),
    );

    // Filter out PKPs where the ethAddress matches the userAddress (those are user PKPs, not agent PKPs)
    const agentPKPs = allPKPs.filter(
      (pkp) => pkp.ethAddress.toLowerCase() !== userAddress.toLowerCase(),
    );
    console.log(
      '[getAgentPKPs] Agent PKPs after filtering:',
      agentPKPs.map((pkp) => ({ tokenId: pkp.tokenId, ethAddress: pkp.ethAddress })),
    );

    // Create the record by fetching appIds for each agent PKP
    const agentPKPMap: AgentPKPMap = {};

    // For each agent PKP, fetch its appIds and map them
    const appIdPromises = agentPKPs.map(async (pkp) => {
      try {
        console.log(`[getAgentPKPs] Fetching appIds for PKP ${pkp.ethAddress}`);
        const appIds = await client.getAllPermittedAppIdsForPkp({
          pkpEthAddress: pkp.ethAddress,
          offset: '0',
        });
        console.log(`[getAgentPKPs] AppIds for ${pkp.ethAddress}:`, appIds);

        // Each PKP should only have one appId, use the first one
        if (appIds.length > 0) {
          console.log(`[getAgentPKPs] Using appId ${appIds[0]} for PKP ${pkp.ethAddress}`);
          return { appId: appIds[0], pkp };
        }
        console.log(`[getAgentPKPs] No appIds found for PKP ${pkp.ethAddress}, returning null`);
        return null;
      } catch (error) {
        // If we can't fetch appIds for this PKP, skip it
        console.warn(`Failed to fetch appIds for PKP ${pkp.ethAddress}:`, error);
        return null;
      }
    });

    const results = await Promise.all(appIdPromises);
    console.log('[getAgentPKPs] Results from appId promises:', results);

    // Build the record
    for (const result of results) {
      if (result) {
        console.log(
          `[getAgentPKPs] Adding to map: appId ${result.appId} -> PKP ${result.pkp.ethAddress}`,
        );
        agentPKPMap[result.appId] = result.pkp;
      }
    }

    console.log('[getAgentPKPs] Final agentPKPMap:', agentPKPMap);
    return agentPKPMap;
  } catch (error) {
    // Rethrow with a more descriptive message if it's not already an Error
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to get Agent PKPs: ${error}`);
    }
  }
}
