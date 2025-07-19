import type { Signer } from 'ethers';

import { getDelegatedPkpEthAddresses } from '@lit-protocol/vincent-contracts-sdk';

/**
 * Retrieves PKP Eth addresses for all delegators of a specific app version
 *
 * This function fetches the delegated agent PKP token IDs for a given app version
 * and then retrieves the PKP Eth address for each token ID. This information
 * can be used to identify and interact with the PKPs that are authorized as agents
 * for the application.
 *
 * The default behaviour of this method is to return the first discovered 1000 PKPs unless `pageOpts` is provided.
 *
 * @param appId - The ID of the Vincent application
 * @param appVersion - The version number of the application
 * @param signer - The ethers signer to use for the transaction
 * @param pageOpts - To fetch more than the first 100 pkps, you must provide pageOpts w/ explicit offset + limit
 *
 * @returns An array of PKP Eth addresses
 *
 * @example
 * ```typescript
 * const pkpEthAddresses = await getDelegatorsAgentPkpAddresses({ appId: 123, appVersion: 1, signer });
 * console.log(`Found ${pkpEthAddresses.length} delegator PKPs`);
 * console.log(`First PKP eth address: ${pkpEthAddresses[0]}`);
 * ```
 */
export async function getDelegatorsAgentPkpAddresses({
  appId,
  appVersion,
  signer,
  pageOpts,
}: {
  appId: number;
  appVersion: number;
  signer: Signer;
  pageOpts?: { offset?: number; limit?: number };
}) {
  return await getDelegatedPkpEthAddresses({
    args: {
      appId,
      version: appVersion,
      pageOpts,
    },
    signer,
  });
}
