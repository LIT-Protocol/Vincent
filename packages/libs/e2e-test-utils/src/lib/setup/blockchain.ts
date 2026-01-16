import { createPublicClient, createWalletClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Wallet } from 'ethers';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { RegisterAppResult } from './types';

/**
 * Create blockchain clients for on-chain operations
 */
export function createClients(privateKey: string, rpcUrl: string, chain: Chain) {
  const account = privateKeyToAccount(privateKey as `0x\${string}`);

  // Override RPC URL with custom URL
  const customChain: Chain = {
    ...chain,
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
  };

  const publicClient = createPublicClient({
    chain: customChain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: customChain,
    transport: http(rpcUrl),
  });

  return { publicClient, walletClient, account };
}

/**
 * Register app on-chain with Vincent Diamond contract using contracts-sdk
 */
export async function registerAppOnChain(
  appManagerWallet: Wallet,
  delegatees: string[],
  abilityIpfsCids: string[],
  abilityPolicies: string[][],
  chain: Chain,
): Promise<RegisterAppResult> {
  console.log('=== Registering App On-Chain ===');
  console.log(`Delegatees: \${delegatees.join(', ')}`);
  console.log(`Abilities: \${abilityIpfsCids.length}`);

  const client = getClient({ signer: appManagerWallet });

  // Register app using contracts-sdk
  const { txHash, appId, newAppVersion, accountIndexHash } = await client.registerApp({
    delegateeAddresses: delegatees,
    versionAbilities: {
      abilityIpfsCids,
      abilityPolicies,
    },
  });

  console.log(`App ID: \${appId}`);
  console.log(`App Version: \${newAppVersion}`);
  console.log(`Account Index Hash: \${accountIndexHash}`);
  if (chain.blockExplorers?.default.url) {
    console.log(`View transaction: \${chain.blockExplorers.default.url}/tx/\${txHash}`);
  }

  return {
    hash: txHash,
    appId: BigInt(appId),
    accountIndexHash,
    appVersion: BigInt(newAppVersion),
  };
}

/**
 * Check if a delegatee already belongs to an app
 * @param delegateeWallet The delegatee wallet to check
 * @returns App info including manager address if found, null otherwise
 */
export async function getAppByDelegatee(
  delegateeWallet: Wallet,
): Promise<{ appId: number; appVersion: number; managerAddress: string } | null> {
  const client = getClient({ signer: delegateeWallet });

  const app = await client.getAppByDelegateeAddress({
    delegateeAddress: delegateeWallet.address,
  });

  if (!app) {
    return null;
  }

  const { id: appId, latestVersion: appVersion, manager: managerAddress } = app;
  console.log(`Found existing app for delegatee ${delegateeWallet.address}:`);
  console.log(`  App ID: ${appId}`);
  console.log(`  Latest Version: ${appVersion}`);
  console.log(`  Manager Address: ${managerAddress}`);

  return { appId, appVersion, managerAddress };
}

/**
 * Register a new app version for an existing app
 * @param appManagerWallet The app manager wallet
 * @param appId The app ID to register a new version for
 * @param abilityIpfsCids Array of ability IPFS CIDs
 * @param abilityPolicies Array of policy IPFS CIDs for each ability
 * @param registerNewVersionOverride Whether to force register even if version exists
 * @returns The new app version
 */
export async function registerNewAppVersion({
  appManagerWallet,
  appId,
  abilityIpfsCids,
  abilityPolicies,
  registerNewVersionOverride = false,
}: {
  appManagerWallet: Wallet;
  appId: number;
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  registerNewVersionOverride?: boolean;
}): Promise<{ appId: number; appVersion: number; txHash: string }> {
  const client = getClient({ signer: appManagerWallet });

  console.log(`=== Registering New App Version for App ${appId} ===`);

  if (!registerNewVersionOverride) {
    // Get the latest version to check if abilities/policies match
    const existingApp = await client.getAppByDelegateeAddress({
      delegateeAddress: appManagerWallet.address,
    });

    if (existingApp) {
      const latestVersion = existingApp.latestVersion;
      const existingAppVersion = await client.getAppVersion({
        appId,
        version: latestVersion,
      });

      if (existingAppVersion) {
        // Create a map from ability CID to its policies
        const existingAbilityMap = new Map<string, string[]>();
        existingAppVersion.appVersion.abilities.forEach((ability) => {
          existingAbilityMap.set(ability.abilityIpfsCid, ability.policyIpfsCids);
        });

        // Check if we have the same abilities and policies
        if (existingAbilityMap.size === abilityIpfsCids.length) {
          const allMatch = abilityIpfsCids.every((abilityId, index) => {
            const existingPolicies = existingAbilityMap.get(abilityId);
            if (existingPolicies === undefined) return false;

            const newPolicies = abilityPolicies[index];
            if (newPolicies === undefined) {
              throw new Error(
                `Parallel arrays are not in sync: abilityPolicies[${index}] is undefined for ability '${abilityId}'.`,
              );
            }

            // Compare policy arrays (order-independent)
            if (existingPolicies.length !== newPolicies.length) return false;

            const sortedExisting = [...existingPolicies].sort();
            const sortedNew = [...newPolicies].sort();

            return sortedExisting.every((policy, i) => policy === sortedNew[i]);
          });

          if (allMatch) {
            console.log(
              `App version ${latestVersion} already has the same abilities and policies. Skipping registration.`,
            );
            return { appId, appVersion: latestVersion, txHash: '' };
          }
        }
      }
    }
  }

  // Register new version if abilities or policies have changed
  const { txHash, newAppVersion } = await client.registerNextVersion({
    appId,
    versionAbilities: {
      abilityIpfsCids,
      abilityPolicies,
    },
  });

  console.log(
    `Registered new App version ${newAppVersion} for existing app: ${appId}\nTx hash: ${txHash}`,
  );

  return { appId, appVersion: newAppVersion, txHash };
}
