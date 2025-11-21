import type { Wallet } from 'ethers';
import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

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
  platformUserPkpInfo: PkpInfo;
  wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    platformUserWalletOwner: Wallet;
    platformUserPkpWallet: PKPEthersWallet;
  };
  appId: number;
  appVersion: number;
}

/**
 * Helper function to set up a Vincent development environment with the new PKP hierarchy.
 * This function handles all the necessary setup steps including:
 * - Checking and funding all required accounts (funder, app delegatee, app manager)
 * - Registering or updating your app with abilities and policies
 * - Creating or using an existing Platform User PKP (owned by EOA)
 * - Creating or using an existing Agent PKP for the app (owned by Platform User PKP)
 * - Setting up permissions for the Agent PKP
 * - Ensuring a valid capacity token exists
 *
 * PKP Hierarchy: EOA → Platform User PKP → Agent PKP (per app)
 *
 * @param permissionData permission data containing abilities and their policies
 * @returns the setup result including agent PKP info, platform user PKP info, wallets, app ID, and app version
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

  // Get or create the Platform User PKP (owned by the EOA)
  const platformUserPkpInfo = await delegator.getFundedPlatformUserPkp();
  // Get Platform User PKP wallet for signing operations
  const platformUserPkpWallet = await delegator.getPlatformUserPkpWallet(platformUserPkpInfo);

  // Get or create the Agent PKP for this app (owned by the Platform User PKP)
  const agentPkpInfo = await delegator.getFundedAgentPkp(appId);

  // Permit the app version for the Agent PKP
  await delegator.permitAppVersionForAgentWalletPkp({
    permissionData,
    appId,
    appVersion,
    agentPkpInfo,
    platformUserPkpWallet,
  });

  // Add permissions for abilities to the Agent PKP
  // Note: This uses the Platform User PKP wallet to add permissions

  await delegator.addPermissionForAbilities(
    platformUserPkpWallet,
    agentPkpInfo.tokenId,
    abilityIpfsCids,
  );

  // Ensure capacity token is valid and unexpired
  await ensureUnexpiredCapacityToken(wallets.appDelegatee);

  return {
    agentPkpInfo,
    platformUserPkpInfo,
    wallets: {
      ...wallets,
      platformUserPkpWallet,
    },
    appId,
    appVersion,
  };
};
