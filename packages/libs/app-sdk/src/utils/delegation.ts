import { ethers } from 'ethers';

import { LIT_NETWORK } from '@lit-protocol/constants';

import { getContract } from './contracts';
import { getPkpInfo } from './pkp';

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
export async function fetchDelegatedAgentPKPTokenIds(appId: number, version: number) {
  try {
    const contract = getContract(LIT_NETWORK.Datil, 'AppView');
    const appView = await contract.getAppVersion(appId, version);

    return appView.appVersion.delegatedAgentPkpTokenIds as ethers.BigNumber[];
  } catch (error) {
    throw new Error(`Error fetching delegated agent PKP token IDs: ${error}`);
  }
}

/**
 * Retrieves PKP information for all delegators of a specific app version
 *
 * This function fetches the delegated agent PKP token IDs for a given app version
 * and then retrieves detailed PKP information for each token ID. This information
 * can be used to identify and interact with the PKPs that are authorized as agents
 * for the application.
 *
 * @param appId - The ID of the Vincent application
 * @param appVersion - The version number of the application
 * @returns An array of PKP information objects containing tokenId, ethAddress, and publicKey
 *
 * @example
 * ```typescript
 * const pkpInfoArray = await getDelegatorsAgentPkpInfo(123, 1);
 * console.log(`Found ${pkpInfoArray.length} delegator PKPs`);
 * console.log(`First PKP address: ${pkpInfoArray[0].ethAddress}`);
 * ```
 */
export async function getDelegatorsAgentPkpInfo(appId: number, appVersion: number) {
  try {
    const delegators = await fetchDelegatedAgentPKPTokenIds(appId, appVersion);
    const delegatorsPkpInfo = await Promise.all(delegators.map(getPkpInfo));

    return delegatorsPkpInfo;
  } catch (error) {
    throw new Error(`Error fetching delegators agent PKP info: ${error}`);
  }
}
