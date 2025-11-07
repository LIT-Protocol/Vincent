import {
  delegator,
  delegatee,
  appManager,
  funder,
  getChainHelpers,
  ensureUnexpiredCapacityToken,
  type PkpInfo,
} from '../index';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { type Wallet } from 'ethers';

export interface SetupResult {
  agentPkpInfo: PkpInfo;
  wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
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
 * const permissionData = {
 *   // EVM Transaction Signer Ability has no policies
 *   // If yours does, you would add the policies to this object
 *   [bundledVincentAbility.ipfsCid]: {},
 * };
 * const result = await setupVincentDevelopmentEnvironment({ permissionData });
 * ```
 */
export const setupVincentDevelopmentEnvironment = async ({
  permissionData,
}: {
  permissionData: PermissionData;
}): Promise<SetupResult> => {
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

  const agentPkpInfo = await delegator.getFundedAgentPkp();

  await delegator.permitAppVersionForAgentWalletPkp({
    permissionData,
    appId,
    appVersion,
    agentPkpInfo,
  });

  await delegator.addPermissionForAbilities(
    wallets.agentWalletOwner,
    agentPkpInfo.tokenId,
    abilityIpfsCids,
  );

  // Ensure capacity token is valid and unexpired
  await ensureUnexpiredCapacityToken(wallets.appDelegatee);

  return {
    agentPkpInfo,
    wallets,
    appId,
    appVersion,
  };
};
