import { ethers } from 'ethers';

import { LIT_NETWORK } from '@lit-protocol/constants';

import { getContract } from './contracts';
import { getPkpEthAddress } from './pkp';

/**
 * Fetches the delegated agent PKP token IDs for a specific app version
 *
 * This function queries the Vincent AppView contract to get the PKP token IDs
 * that have delegated to a specific app version. These token IDs can be used
 * to identify the PKPs that are authorized to act as agents for the app.
 *
 * @param appId - The ID of the Vincent application
 * @param version - The version number of the application
 * @returns An array of BigNumber representing the delegated agent PKP token IDs
 *
 * @example
 * ```typescript
 * const tokenIds = await fetchDelegatedAgentPKPTokenIds(123, 1);
 * console.log(`App has ${tokenIds.length} delegated agent PKPs`);
 * ```
 */
async function fetchDelegatedAgentPKPTokenIds(appId: number, version: number) {
  try {
    const contract = getContract(LIT_NETWORK.Datil, 'AppView');
    const appView = await contract.getAppVersion(appId, version);

    return appView.appVersion.delegatedAgentPkpTokenIds as ethers.BigNumber[];
  } catch (error) {
    throw new Error(`Error fetching delegated agent PKP token IDs: ${error}`);
  }
}

async function processWithConcurrency<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  concurrencyLimit: number
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  // Start initial set of promises
  const workers = Array(concurrencyLimit)
    .fill(null)
    .map(async () => {
      while (index < items.length) {
        const currentIndex = index++;
        if (currentIndex >= items.length) break;

        try {
          const result = await processFn(items[currentIndex]);
          results[currentIndex] = result;
        } catch (error) {
          // Store the error but don't throw until all are done
          results[currentIndex] = error as R;
        }
      }
    });

  await Promise.all(workers);
  return results;
}

/**
 * Retrieves PKP Eth addresses for all delegators of a specific app version
 *
 * This function fetches the delegated agent PKP token IDs for a given app version
 * and then retrieves the PKP Eth address for each token ID. This information
 * can be used to identify and interact with the PKPs that are authorized as agents
 * for the application.
 *
 * @param appId - The ID of the Vincent application
 * @param appVersion - The version number of the application
 * @returns An array of PKP Eth addresses
 *
 * @example
 * ```typescript
 * const pkpEthAddresses = await getDelegatorsAgentPkpAddresses(123, 1);
 * console.log(`Found ${pkpEthAddresses.length} delegator PKPs`);
 * console.log(`First PKP eth address: ${pkpEthAddresses[0]}`);
 * ```
 */
export async function getDelegatorsAgentPkpAddresses(appId: number, appVersion: number) {
  try {
    const delegators = await fetchDelegatedAgentPKPTokenIds(appId, appVersion);
    const delegatorsPkpEthAddresses = await processWithConcurrency(delegators, getPkpEthAddress, 5);

    return delegatorsPkpEthAddresses;
  } catch (error) {
    throw new Error(`Error fetching delegators agent PKP info: ${error}`);
  }
}
