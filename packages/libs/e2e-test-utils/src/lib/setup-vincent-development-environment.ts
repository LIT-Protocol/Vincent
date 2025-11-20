import type { Wallet } from 'ethers';

import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import type { PkpInfo } from './mint-new-pkp';

import * as appManager from './appManager';
import { getChainHelpers } from './chain';
import * as delegatee from './delegatee';
import * as delegator from './delegator';
import { ensureUnexpiredCapacityToken } from './ensure-capacity-credit';
import * as funder from './funder';

export interface VincentDevEnvironment {
  agentPkpInfo: PkpInfo;
  userPlatformPkpInfo: PkpInfo;
  wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    platformUserPkpOwner: Wallet;
  };
  appId: number;
  appVersion: number;
}

/**
 * Helper function to set up a Vincent development environment.
 * This function handles all the necessary setup steps including:
 * - Checking and funding all required accounts (funder, app delegatee, app manager)
 * - Registering or updating your app with abilities and policies
 * - Creating or using an existing agent PKP
 * - Setting up permissions for the agent PKP
 * - Ensuring a valid capacity token exists
 *
 * @param permissionData permission data containing abilities and their policies
 * @returns the setup result including agent PKP info, wallets, app ID, and app version
 * @example
 * ```typescript
 * // Example with no policies
 * const permissionData = {
 *   [bundledVincentAbility.ipfsCid]: {},
 * };
 *
 * // Example with policies
 * const permissionDataWithPolicies = {
 *   [bundledVincentAbility.ipfsCid]: {
 *     [spendingLimitPolicy.ipfsCid]: {
 *       limit: '1000000',
 *       period: '86400',
 *     },
 *   },
 * };
 *
 * const result = await setupVincentDevelopmentEnvironment({ permissionData });
 * ```
 */
export const setupVincentDevelopmentEnvironment = async ({
  permissionData,
}: {
  permissionData: PermissionData;
}): Promise<VincentDevEnvironment> => {
  // Check and fund all required accounts
  await funder.checkFunderBalance();
  await delegatee.ensureAppDelegateeFunded();
  await appManager.ensureAppManagerFunded();

  const chainHelpers = await getChainHelpers();
  const wallets = chainHelpers.wallets;

  const abilityIpfsCids: string[] = Object.keys(permissionData);
  const abilityPolicies: string[][] = abilityIpfsCids.map((abilityIpfsCid) => {
    return Object.keys(permissionData[abilityIpfsCid]);
  });

  // If an app exists for the delegatee, we will create a new app version with the new ipfs cids
  // Otherwise, we will create an app w/ version 1 appVersion with the new ipfs cids
  const existingApp = await delegatee.getAppInfo();
  let appId: number;
  let appVersion: number;
  if (!existingApp) {
    const newApp = await appManager.registerNewApp({ abilityIpfsCids, abilityPolicies });
    appId = newApp.appId;
    appVersion = newApp.appVersion;
  } else {
    const newAppVersion = await appManager.registerNewAppVersion({
      abilityIpfsCids,
      abilityPolicies,
    });
    appId = existingApp.appId;
    appVersion = newAppVersion.appVersion;
  }

  // Get or create the User Platform PKP (owned by the EOA)
  const userPlatformPkpInfo = await delegator.getFundedUserPlatformPkp();

  // Get or create the Agent PKP for this app (owned by the User Platform PKP)
  const agentPkpInfo = await delegator.getFundedAgentPkp(appId);

  await delegator.permitAppVersionForAgentWalletPkp({
    permissionData,
    appId,
    appVersion,
    agentPkpInfo,
  });

  // Note: We need to add permissions using a PKP session sig from the User Platform PKP
  // For now, we'll still use the platformUserPkpOwner since it initially owns the PKP during minting
  // TODO: Update this to use PKP session signatures from the User Platform PKP
  await delegator.addPermissionForAbilities(
    wallets.platformUserPkpOwner,
    agentPkpInfo.tokenId,
    abilityIpfsCids,
  );

  // Ensure capacity token is valid and unexpired
  await ensureUnexpiredCapacityToken(wallets.appDelegatee);

  return {
    agentPkpInfo,
    userPlatformPkpInfo,
    wallets,
    appId,
    appVersion,
  };
};
