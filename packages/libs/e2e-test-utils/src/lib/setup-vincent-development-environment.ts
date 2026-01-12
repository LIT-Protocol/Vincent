import type { Wallet } from 'ethers';

import { extractChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as viemChains from 'viem/chains';

import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
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
import { setupZerodevAccount, setupCrossmintAccount, setupSafeAccount } from './smartAccount';

export interface VincentDevEnvironment {
  agentPkpInfo: PkpInfo;
  agentAddress: string;
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
  smartAccount?: SmartAccountInfo;
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
 * - Optionally creating a smart account owned by agentWalletOwner with the PKP as a permitted signer
 *
 * PKP Hierarchy: EOA → Platform User PKP → Agent PKP (per app)
 *
 * @param permissionData permission data containing abilities and their policies
 * @param smartAccountType type of smart account to create: 'zerodev', 'crossmint', 'safe', or false to disable
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
 * // ZeroDev smart account mode (requires SMART_ACCOUNT_CHAIN_ID and ZERODEV_RPC_URL env vars)
 * const result = await setupVincentDevelopmentEnvironment({
 *   permissionData,
 *   smartAccountType: 'zerodev',
 * });
 *
 * // Crossmint smart account mode (requires SMART_ACCOUNT_CHAIN_ID and CROSSMINT_API_KEY env vars)
 * const result = await setupVincentDevelopmentEnvironment({
 *   permissionData,
 *   smartAccountType: 'crossmint',
 * });
 *
 * // Safe smart account mode (requires SMART_ACCOUNT_CHAIN_ID, SAFE_RPC_URL, and PIMLICO_RPC_URL env vars)
 * const result = await setupVincentDevelopmentEnvironment({
 *   permissionData,
 *   smartAccountType: 'safe',
 * });
 * ```
 */
export const setupVincentDevelopmentEnvironment = async ({
  permissionData,
  smartAccountType,
  agentAddress,
}: {
  permissionData: PermissionData;
  smartAccountType?: 'zerodev' | 'crossmint' | 'safe';
  agentAddress?: string;
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

  // Ensure capacity token for the EOA wallet that owns the Platform User PKP
  await ensureUnexpiredCapacityToken(wallets.platformUserWalletOwner);

  // Get or create the Platform User PKP (owned by the EOA)
  // This also ensures the PKP has ETH for gas
  const platformUserPkpInfo = await delegator.getFundedPlatformUserPkp();

  // Get Platform User PKP ethers wallet for signing operations
  const platformUserPkpWallet = await delegator.getPlatformUserPkpWallet(platformUserPkpInfo);

  // Ensure capacity token for the Platform User PKP wallet
  await ensureUnexpiredCapacityToken(platformUserPkpWallet);

  // Get or create the Agent PKP for this app (owned by the Platform User PKP)
  const agentPkpInfo = await delegator.getFundedAgentPkp(appId);

  // Optionally set up smart account
  let smartAccount: SmartAccountInfo | undefined;
  let resolvedAgentAddress = agentAddress ?? agentPkpInfo.ethAddress;
  if (smartAccountType) {
    console.log(`\n🔧 Setting up ${smartAccountType} smart account...\n`);

    const env = getEnv();
    const { SMART_ACCOUNT_CHAIN_ID } = env;

    if (!SMART_ACCOUNT_CHAIN_ID) {
      throw new Error('SMART_ACCOUNT_CHAIN_ID env var is required when smartAccountType is set');
    }

    const chainId = parseInt(SMART_ACCOUNT_CHAIN_ID);

    // Extract chain from viem's exported chains using chainId
    const chains = Object.values(viemChains);
    // Type assertion needed: extractChain expects literal union type but we have runtime value from env
    const chain = extractChain({
      chains,
      id: chainId as (typeof chains)[number]['id'],
    });

    // Convert ethers wallet to viem account
    const ownerAccount = privateKeyToAccount(
      wallets.platformUserWalletOwner.privateKey as `0x${string}`,
    );

    if (smartAccountType === 'zerodev') {
      smartAccount = await setupZerodevAccount({
        ownerAccount,
        permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
        chain,
      });
    } else if (smartAccountType === 'crossmint') {
      smartAccount = await setupCrossmintAccount({
        ownerAccount,
        permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
        chain,
      });
    } else {
      smartAccount = await setupSafeAccount({
        ownerAccount,
        permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
        chain,
      });
    }
    resolvedAgentAddress = smartAccount.account.address;
  }
  if (resolvedAgentAddress === agentPkpInfo.ethAddress) {
    console.warn(
      '[setupVincentDevelopmentEnvironment] Using agent PKP address as agentAddress. Set agentAddress or smartAccountType to use a smart account.',
    );
  }

  // Permit the app version for the Agent PKP
  await delegator.permitAppVersionForAgentWalletPkp({
    permissionData,
    appId,
    appVersion,
    agentPkpInfo,
    platformUserPkpWallet,
    agentAddress: resolvedAgentAddress,
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
    agentAddress: resolvedAgentAddress,
    platformUserPkpInfo,
    wallets: {
      ...wallets,
      platformUserPkpWallet,
    },
    appId,
    appVersion,
    smartAccount,
  };
};
