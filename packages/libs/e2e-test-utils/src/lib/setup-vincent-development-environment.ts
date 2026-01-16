import { Wallet, providers } from 'ethers';
import type { Address } from 'viem';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { SetupConfig, VincentDevEnvironment } from './setup/types';
import { registerAppOnChain, getAppByDelegatee, registerNewAppVersion } from './setup/blockchain';
import {
  registerAppWithAPI,
  registerAppVersion,
  setActiveVersion,
  installAppViaAPI,
} from './setup/api';
import {
  checkFunderBalance,
  ensureAppManagerFunded,
  ensureWalletHasTestTokens,
} from './setup/funding';
import { createKernelSmartAccount } from './setup/smart-account';
import { ensureUnexpiredCapacityToken } from './setup/capacity-credit';

/**
 * Setup a Vincent development environment using PKP-based architecture with smart accounts.
 *
 * This uses a hybrid approach with 4 EOA wallets + 1 PKP:
 * 1. Funder EOA - funds other wallets with test tokens
 * 2. App Manager EOA - owns and registers the app on-chain
 * 3. App Delegatee EOA - executes transactions on behalf of users (via Lit Actions)
 * 4. User EOA - owns their smart account
 * 5. Agent Signer PKP - session key created by registry API (NOT an EOA)
 *
 * The flow:
 * 1. Check funder balance and fund app manager and delegatee
 * 2. Ensure app delegatee has a valid capacity credit (required for Lit Actions)
 * 3. Check if delegatee already belongs to an app (a delegatee can only belong to one app)
 *    - If yes: register a new app version
 *    - If no: register a new app on-chain
 * 4. Register app with Vincent API backend
 * 5. Set active version in API
 * 6. Install app via registry API to create PKP (agentSignerAddress) and deploy smart account
 * 7. Create a local smart account client to interact with the deployed smart account
 *
 * @param config Configuration for the development environment setup
 * @returns Environment with app ID, addresses, wallets, and smart account client
 *
 * @example
 * ```typescript
 * import { setupVincentDevelopmentEnvironment } from '@lit-protocol/vincent-e2e-test-utils';
 * import { baseSepolia } from 'viem/chains';
 *
 * const env = await setupVincentDevelopmentEnvironment({
 *   abilityIpfsCids: ['QmRkPbEyFSzdknk6fBQYnKRHKfSs2AYpgcjZVQ699BMnLz'],
 *   abilityPolicies: [[]],
 *   rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/YOUR_KEY',
 *   chain: baseSepolia,
 *   vincentApiUrl: 'https://api.heyvincent.ai',
 *   appMetadata: {
 *     name: 'Test App',
 *     description: 'Test app for development',
 *     contactEmail: 'test@example.com',
 *     appUrl: 'https://example.com',
 *   },
 *   privateKeys: {
 *     funder: '0x...',
 *     appManager: '0x...',
 *     appDelegatee: '0x...',
 *     userEoa: '0x...',
 *   },
 * });
 * ```
 */
export async function setupVincentDevelopmentEnvironment(
  config: SetupConfig,
): Promise<VincentDevEnvironment> {
  console.log('\n Setting up Vincent Development Environment');
  console.log(`Network: ${config.chain.name} (Chain ID: ${config.chain.id})`);
  console.log(`RPC URL: ${config.rpcUrl}`);

  // Create wallets from private keys
  const funderWallet = new Wallet(config.privateKeys.funder);
  const appManagerWallet = new Wallet(config.privateKeys.appManager);
  const appDelegateeWallet = new Wallet(config.privateKeys.appDelegatee);
  const userEoaWallet = new Wallet(config.privateKeys.userEoa);

  console.log(`\nFunder: ${funderWallet.address}`);
  console.log(`App Manager: ${appManagerWallet.address}`);
  console.log(`App Delegatee: ${appDelegateeWallet.address}`);
  console.log(`User EOA: ${userEoaWallet.address}`);

  // Create ethers provider for wallet operations on target chain (Base Sepolia)
  const ethersProvider = new providers.JsonRpcProvider(config.rpcUrl);

  // Connect wallets to provider for ethers operations
  const funderWithProvider = funderWallet.connect(ethersProvider);
  const appManagerWithProvider = appManagerWallet.connect(ethersProvider);
  const appDelegateeWithProvider = appDelegateeWallet.connect(ethersProvider);

  // Check funder balance and fund required accounts on Base Sepolia
  console.log('\n=== Checking Balances and Funding (Base Sepolia) ===');
  await checkFunderBalance(funderWithProvider);
  await ensureAppManagerFunded(appManagerWallet.address, funderWithProvider);

  // Fund app delegatee (needs gas to execute transactions on behalf of users)
  await ensureWalletHasTestTokens({
    address: appDelegateeWallet.address,
    funderWallet: funderWithProvider,
  });

  // Fund app delegatee on Datil chain for capacity credit minting
  console.log('\n=== Funding on Datil Chain (for Capacity Credits) ===');
  const datilProvider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com/');
  const funderOnDatil = funderWallet.connect(datilProvider);

  await ensureWalletHasTestTokens({
    address: appDelegateeWallet.address,
    funderWallet: funderOnDatil,
    minAmountEther: '0.02', // Minimum amount for capacity credit minting
  });

  // Ensure app delegatee has a valid capacity credit (required for executing Lit Actions)
  await ensureUnexpiredCapacityToken(appDelegateeWithProvider);

  // Check if delegatee already belongs to an app
  const existingApp = await getAppByDelegatee(appDelegateeWithProvider);

  let appId: number;
  let appVersion: number;
  let hash: string;
  let accountIndexHash: string;
  let needsNewVersion = false; // Track if we need to create a new version for existing apps

  if (existingApp) {
    // Validate that the app is managed by the app manager
    if (existingApp.managerAddress.toLowerCase() !== appManagerWallet.address.toLowerCase()) {
      const errorMessage = `❌ Delegatee ${appDelegateeWallet.address} already belongs to app ${existingApp.appId} managed by ${existingApp.managerAddress}, but you are trying to register with app manager ${appManagerWallet.address}. A delegatee can only belong to one app. Please use a different delegatee address or use the correct app manager.`;
      console.error(`\\n${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Delegatee already belongs to an app managed by this app manager
    console.log('\n⚠️  Delegatee already belongs to an existing app managed by this app manager.');
    console.log('Checking if abilities/policies have changed...');
    appId = existingApp.appId;

    // Fetch the accountIndexHash from on-chain app data
    const client = getClient({ signer: appManagerWithProvider });
    const appData = await client.getAppById({ appId: existingApp.appId });
    if (!appData) {
      throw new Error(`Failed to fetch app data for app ID ${existingApp.appId}`);
    }
    accountIndexHash = appData.accountIndexHash;

    // Check if the latest version already has the same abilities and policies
    const latestVersion = existingApp.appVersion;
    const existingAppVersion = await client.getAppVersion({
      appId: existingApp.appId,
      version: latestVersion,
    });

    // Default: assume we need a new version
    needsNewVersion = true;
    appVersion = latestVersion; // Start with latest version, will update if creating new one
    hash = ''; // Default to empty hash

    if (existingAppVersion) {
      // Create a map from ability CID to its policies for easy lookup
      const existingAbilityMap = new Map<string, string[]>();
      existingAppVersion.appVersion.abilities.forEach((ability) => {
        existingAbilityMap.set(ability.abilityIpfsCid, ability.policyIpfsCids);
      });

      // Check if we have the same number of abilities and compare them
      if (existingAbilityMap.size === config.abilityIpfsCids.length) {
        // For each ability in the new version, check if it exists with the same policies
        const allMatch = config.abilityIpfsCids.every((abilityId, index) => {
          const existingPolicies = existingAbilityMap.get(abilityId);
          if (existingPolicies === undefined) return false; // Ability doesn't exist in current version

          const newPolicies = config.abilityPolicies[index];
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
            `✅ App version ${latestVersion} already has the same abilities and policies.`,
          );
          console.log('Skipping version registration - reusing existing version.');
          needsNewVersion = false;
          // appVersion and hash already set to correct values above
        }
      }
    }

    if (needsNewVersion) {
      console.log('Abilities or policies have changed - creating new version.');

      // Step 1: Create pending version in registry API
      // This must be done BEFORE registering on-chain to follow the intended workflow
      console.log('Creating pending version in registry...');
      const apiVersion = await registerAppVersion(
        config.vincentApiUrl,
        config.privateKeys.appManager,
        Number(appId),
        'New version with updated abilities',
      );
      console.log(`Pending version ${apiVersion} created in registry`);

      // Step 2: Register the new version on-chain
      const result = await registerNewAppVersion({
        appManagerWallet: appManagerWithProvider,
        appId: existingApp.appId,
        abilityIpfsCids: config.abilityIpfsCids,
        abilityPolicies: config.abilityPolicies,
      });
      appVersion = result.appVersion;
      hash = result.txHash;

      // Wait for 2 block confirmations before proceeding (if there was a new transaction)
      if (hash) {
        console.log('⏳ Waiting for 2 block confirmations...');
        await ethersProvider.waitForTransaction(hash, 2);
        console.log('✅ Transaction confirmed');
      }

      // Verify that on-chain version matches API version
      if (apiVersion !== appVersion) {
        console.warn(
          `⚠️  Version mismatch: API created v${apiVersion} but on-chain is v${appVersion}`,
        );
      }
    }
  } else {
    // No existing app, register a new one
    const result = await registerAppOnChain(
      appManagerWithProvider,
      [appDelegateeWallet.address],
      config.abilityIpfsCids,
      config.abilityPolicies,
      config.chain,
    );
    hash = result.hash;
    appId = Number(result.appId);
    accountIndexHash = result.accountIndexHash;
    appVersion = Number(result.appVersion);

    // Wait for 2 block confirmations before proceeding
    console.log('⏳ Waiting for 2 block confirmations...');
    await ethersProvider.waitForTransaction(hash, 2);
    console.log('✅ Transaction confirmed');
  }

  // Step 3: Register with Vincent API (for new apps only)
  if (!existingApp) {
    // New app: register it with the API (this creates version 1 in the database)
    await registerAppWithAPI(
      config.vincentApiUrl,
      config.privateKeys.appManager,
      Number(appId),
      config.appMetadata,
    );

    // Step 4: Set active version (requires version to exist in database)
    await setActiveVersion(
      config.vincentApiUrl,
      config.privateKeys.appManager,
      Number(appId),
      Number(appVersion),
    );
  } else if (needsNewVersion) {
    // Existing app with new version: version was already created in registry in step 1
    console.log('\n⚠️  App already exists in registry - new version was created');

    // Step 4: Set active version to the newly created version
    await setActiveVersion(
      config.vincentApiUrl,
      config.privateKeys.appManager,
      Number(appId),
      Number(appVersion),
    );
  } else {
    // Existing app with same version: skip API registration and setActiveVersion
    console.log('\n⚠️  App and version already exist in registry - skipping API updates');
  }

  // Step 5: Install app via registry API to create PKP
  const installData = await installAppViaAPI(
    config.vincentApiUrl,
    Number(appId),
    userEoaWallet.address,
  );

  const pkpSignerAddress = installData.agentSignerAddress;
  const agentSmartAccountAddress = installData.agentSmartAccountAddress;

  console.log(`\nPKP Signer Address (from API): ${pkpSignerAddress}`);
  console.log(`Agent Smart Account Address (from API): ${agentSmartAccountAddress}`);

  // Step 6: Create local smart account client
  // Note: The smart account is already deployed by the registry API.
  // This step creates a local client instance to interact with it.
  const smartAccount = await createKernelSmartAccount(
    config.privateKeys.userEoa,
    pkpSignerAddress as Address,
    accountIndexHash,
    config.chain,
    config.rpcUrl,
  );

  // Verify the local client's address matches what the API returned
  if (smartAccount.account.address.toLowerCase() !== agentSmartAccountAddress.toLowerCase()) {
    console.error(
      `\n❌ Address mismatch! Local client address ${smartAccount.account.address} doesn't match API's ${agentSmartAccountAddress}`,
    );
    throw new Error('Smart account address mismatch');
  }

  console.log('\n✅ Local smart account client address matches API response!');

  console.log('\n✅ Vincent Development Environment Setup Complete!');

  return {
    appId: Number(appId),
    appVersion: Number(appVersion),
    agentSignerAddress: pkpSignerAddress,
    agentSmartAccountAddress,
    userEoaAddress: userEoaWallet.address,
    accountIndexHash,
    registrationTxHash: hash,
    wallets: {
      appManager: appManagerWallet,
      appDelegatee: appDelegateeWallet,
      userEoa: userEoaWallet,
      funder: funderWallet,
    },
    smartAccount,
  };
}

// Re-export types for convenience
export type { SetupConfig, VincentDevEnvironment, SmartAccountInfo } from './setup/types';
