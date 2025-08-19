import { IRelayPKP } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { SELECTED_LIT_NETWORK } from './lit';
import { readOnlySigner } from '../developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

export type AgentAppPermission = {
  appId: number;
  pkp: IRelayPKP;
};

export type GetAgentPKPsResult = {
  permitted: AgentAppPermission[];
  unpermitted: IRelayPKP[];
};

/**
 * Get Agent PKPs for a user address
 *
 * Finds all Agent PKPs owned by the user that are different from their current PKP.
 * Separates them into permitted (flat array of app-PKP pairs) and unpermitted PKPs.
 *
 * @param userAddress The ETH address of the user's current PKP
 * @returns Promise<GetAgentPKPsResult> Object containing permitted and unpermitted PKPs
 * @throws Error if there's an issue with the contract calls
 */
export async function getAgentPKPs(userAddress: string): Promise<GetAgentPKPsResult> {
  try {
    const pkpNftContract = getPkpNftContract(SELECTED_LIT_NETWORK);

    const balance = await pkpNftContract.balanceOf(userAddress);
    if (balance.toNumber() === 0) {
      return { permitted: [], unpermitted: [] };
    }

    // Get all token IDs in parallel first
    const tokenIds = await Promise.all(
      Array.from({ length: balance.toNumber() }, (_, i) =>
        pkpNftContract.tokenOfOwnerByIndex(userAddress, i),
      ),
    );

    // Then get all PKP data in parallel
    const pkpDataPromises = tokenIds.map(async (tokenId) => {
      const [publicKey] = await Promise.all([pkpNftContract.getPubkey(tokenId)]);
      const ethAddress = ethers.utils.computeAddress(publicKey);

      return {
        tokenId: tokenId.toString(),
        publicKey,
        ethAddress,
      };
    });

    const allPKPs = await Promise.all(pkpDataPromises);

    // Filter out PKPs where the ethAddress matches the userAddress (userPKP)
    const agentPKPs = allPKPs.filter(
      (pkp) => pkp.ethAddress.toLowerCase() !== userAddress.toLowerCase(),
    );

    // For each agent PKP, fetch its appIds and categorize them
    const pkpPermissionPromises = agentPKPs.map(async (pkp) => {
      const client = getClient({ signer: readOnlySigner });
      const appIds = await client.getAllPermittedAppIdsForPkp({
        pkpEthAddress: pkp.ethAddress,
        offset: '0',
      });

      return { pkp, appIds };
    });

    const results = await Promise.all(pkpPermissionPromises);

    // Separate into permitted and unpermitted
    const permitted: AgentAppPermission[] = [];
    const unpermitted: IRelayPKP[] = [];

    for (const result of results) {
      const { pkp, appIds } = result;

      if (appIds.length > 0) {
        // PKP has permitted apps - add each app-PKP pair
        for (const appId of appIds) {
          permitted.push({ appId, pkp });
        }
      } else {
        // PKP has no permitted apps yet
        unpermitted.push(pkp);
      }
    }

    const result = { permitted, unpermitted };
    console.log('[getAgentPKPs] Final result:', {
      permittedCount: result.permitted.length,
      permitted: result.permitted,
      unpermittedCount: result.unpermitted.length,
      unpermitted: result.unpermitted,
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to get Agent PKPs: ${error}`);
    }
  }
}

/**
 * Get the Agent PKP for a specific app ID
 *
 * @param agentPkpResult Result from getAgentPKPs
 * @param appId The app ID to get the PKP for
 * @returns Object with PKP and whether it's the last unpermitted PKP
 */
export function getAgentPKPForApp(
  agentPkpResult: GetAgentPKPsResult,
  appId: number,
): { pkp: IRelayPKP | null; isLastUnpermittedPKP: boolean } {
  // First check if there are PKPs for this app
  const pkpForApp = agentPkpResult.permitted.find((p) => p.appId === appId);

  if (pkpForApp) {
    console.log(
      `[getAgentPKPForApp] Found specific PKP for appId ${appId}:`,
      pkpForApp.pkp.ethAddress,
    );
    return { pkp: pkpForApp.pkp, isLastUnpermittedPKP: false };
  }

  // If no specific PKP found, use the first unpermitted PKP for new connections
  if (agentPkpResult.unpermitted.length > 0) {
    const isLastUnpermittedPKP = agentPkpResult.unpermitted.length === 1;
    console.log(
      `[getAgentPKPForApp] No specific PKP for appId ${appId}, using first unpermitted PKP:`,
      agentPkpResult.unpermitted[0].ethAddress,
      `(isLast: ${isLastUnpermittedPKP})`,
    );
    return { pkp: agentPkpResult.unpermitted[0], isLastUnpermittedPKP };
  }

  console.log(
    `[getAgentPKPForApp] No PKP found for appId ${appId} and no unpermitted PKPs available`,
  );
  return { pkp: null, isLastUnpermittedPKP: false };
}
