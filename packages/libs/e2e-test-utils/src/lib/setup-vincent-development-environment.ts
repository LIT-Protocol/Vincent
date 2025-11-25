import type { Wallet } from 'ethers';
import { extractChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as viemChains from 'viem/chains';

import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import type { PkpInfo } from './mint-new-pkp';
import type { SmartAccountInfo } from './smartAccount';

import * as appManager from './appManager';
import { getChainHelpers } from './chain';
import * as delegatee from './delegatee';
import * as delegator from './delegator';
import { ensureUnexpiredCapacityToken } from './ensure-capacity-credit';
import { getEnv } from './env';
import * as funder from './funder';
import { setupSmartAccount } from './smartAccount';

export interface VincentDevEnvironment {
  agentPkpInfo: PkpInfo;
  wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
  appId: number;
  appVersion: number;
  smartAccount?: SmartAccountInfo;
}

/**
 * Helper function to set up a Vincent development environment.
 * This function handles all the necessary setup steps including:
 * - Checking and funding all required accounts (funder, app delegatee, app manager)
 * - Registering or updating your app with abilities and policies
 * - Creating or using an existing agent PKP
 * - Setting up permissions for the agent PKP
 * - Ensuring a valid capacity token exists
 * - Optionally creating a smart account owned by agentWalletOwner with the PKP as a permitted signer
 *
 * @param permissionData permission data containing abilities and their policies
 * @param enableSmartAccount whether to create a smart account (requires SMART_ACCOUNT_CHAIN_ID and ZERODEV_RPC_URL env vars)
 * @returns the setup result including agent PKP info, wallets, app ID, app version, and optional smart account info
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
 * // EOA mode
 * const result = await setupVincentDevelopmentEnvironment({ permissionData });
 *
 * // Smart account mode (requires SMART_ACCOUNT_CHAIN_ID and ZERODEV_RPC_URL env vars)
 * const result = await setupVincentDevelopmentEnvironment({
 *   permissionData,
 *   enableSmartAccount: true,
 * });
 * ```
 */
export const setupVincentDevelopmentEnvironment = async ({
  permissionData,
  enableSmartAccount = false,
}: {
  permissionData: PermissionData;
  enableSmartAccount?: boolean;
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

  // Optionally set up smart account
  let smartAccount: SmartAccountInfo | undefined;
  if (enableSmartAccount) {
    console.log('\n🔧 Setting up smart account...\n');

    const env = getEnv();
    const { SMART_ACCOUNT_CHAIN_ID, ZERODEV_RPC_URL } = env;

    if (!SMART_ACCOUNT_CHAIN_ID) {
      throw new Error('SMART_ACCOUNT_CHAIN_ID env var is required when enableSmartAccount=true');
    }
    if (!ZERODEV_RPC_URL) {
      throw new Error('ZERODEV_RPC_URL env var is required when enableSmartAccount=true');
    }

    const chainId = parseInt(SMART_ACCOUNT_CHAIN_ID);

    // Extract chain from viem's exported chains using chainId
    // Type assertion needed: extractChain expects literal union type but we have runtime value
    const chain = extractChain({
      chains: Object.values(viemChains),
      id: chainId as any,
    });

    // Convert ethers wallet to viem account
    const ownerAccount = privateKeyToAccount(wallets.agentWalletOwner.privateKey as `0x${string}`);

    smartAccount = await setupSmartAccount({
      ownerAccount,
      permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
      chain,
      zerodevRpcUrl: ZERODEV_RPC_URL,
    });

    console.log(`✅ Smart account created at: ${smartAccount.address}\n`);
  }

  return {
    agentPkpInfo,
    wallets,
    appId,
    appVersion,
    smartAccount,
  };
};
