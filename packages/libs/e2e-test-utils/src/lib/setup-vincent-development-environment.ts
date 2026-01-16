import type { Address } from 'viem';

import type { SetupConfig, VincentDevEnvironment } from './setup/types';
import { setupWallets } from './setup/wallets';
import { handleAppRegistration } from './setup/app-registration';
import { registerAppWithAPI, setActiveVersion, installAppViaAPI } from './setup/api';
import { createKernelSmartAccount } from './setup/smart-account';

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
 *    - If yes: check if abilities/policies changed, register new version if needed
 *    - If no: register a new app on-chain
 * 4. Register app with Vincent API backend (new apps only)
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

  // Step 1: Setup wallets and fund them
  const wallets = await setupWallets(config.privateKeys, config.rpcUrl);

  // Step 2: Handle app registration (new app or new version)
  const registration = await handleAppRegistration({
    appManagerWithProvider: wallets.appManagerWithProvider,
    appDelegateeWithProvider: wallets.appDelegateeWithProvider,
    abilityIpfsCids: config.abilityIpfsCids,
    abilityPolicies: config.abilityPolicies,
    chain: config.chain,
    vincentApiUrl: config.vincentApiUrl,
    appManagerPrivateKey: config.privateKeys.appManager,
    ethersProvider: wallets.ethersProvider,
  });

  // Step 3: Register with Vincent API and set active version
  if (registration.isNewApp) {
    // New app: register it with the API (this creates version 1 in the database)
    await registerAppWithAPI(
      config.vincentApiUrl,
      config.privateKeys.appManager,
      registration.appId,
      config.appMetadata,
    );

    // Set active version (requires version to exist in database)
    await setActiveVersion(
      config.vincentApiUrl,
      config.privateKeys.appManager,
      registration.appId,
      registration.appVersion,
    );
  } else if (registration.needsNewVersion) {
    // Existing app with new version: version was already created in registry
    console.log('⚠️  App already exists in registry - new version was created');

    // Set active version to the newly created version
    await setActiveVersion(
      config.vincentApiUrl,
      config.privateKeys.appManager,
      registration.appId,
      registration.appVersion,
    );
  } else {
    // Existing app with same version: skip API registration and setActiveVersion
    console.log('⚠️  App and version already exist in registry - skipping API updates');
  }

  // Step 4: Install app via registry API to create PKP
  const installData = await installAppViaAPI(
    config.vincentApiUrl,
    registration.appId,
    wallets.userEoaWallet.address,
  );

  const pkpSignerAddress = installData.agentSignerAddress;
  const agentSmartAccountAddress = installData.agentSmartAccountAddress;

  console.log(`\nPKP Signer Address (from API): ${pkpSignerAddress}`);
  console.log(`Agent Smart Account Address (from API): ${agentSmartAccountAddress}`);

  // Step 5: Create local smart account client
  // This creates a local client instance. The actual deployment happens in Step 6.
  const smartAccount = await createKernelSmartAccount(
    config.privateKeys.userEoa,
    pkpSignerAddress as Address,
    registration.accountIndexHash,
    config.chain,
    config.rpcUrl,
    config.zerodevProjectId,
  );

  // Verify the local client's address matches what the API returned
  if (smartAccount.account.address.toLowerCase() !== agentSmartAccountAddress.toLowerCase()) {
    console.error(
      `\n❌ Address mismatch! Local client address ${smartAccount.account.address} doesn't match API's ${agentSmartAccountAddress}`,
    );
    throw new Error('Smart account address mismatch');
  }

  console.log('Local smart account client address matches API response!');

  // Step 6: Deploy the smart account by sending a 0 value transaction (if not already deployed)
  console.log('\n=== Deploying Smart Account ===');

  // Check if smart account is already deployed
  const code = await wallets.ethersProvider.getCode(agentSmartAccountAddress);
  const isDeployed = code !== '0x';

  if (isDeployed) {
    console.log('Smart account already deployed, skipping deployment step');
  } else {
    console.log('Deploying smart account via UserOperation...');

    try {
      // Send a UserOperation with a simple call (0 value to 0 address)
      // This will trigger the smart account deployment
      const userOpHash = await smartAccount.client.sendUserOperation({
        callData: await smartAccount.account.encodeCalls([
          {
            to: '0x0000000000000000000000000000000000000000' as Address,
            value: 0n,
            data: '0x',
          },
        ]),
      });

      console.log(`UserOperation hash: ${userOpHash}`);

      // Wait for the UserOperation to be included in a block
      const receipt = await smartAccount.client.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      console.log(`Transaction hash: ${receipt.receipt.transactionHash}`);

      // Verify deployment
      const code = await wallets.ethersProvider.getCode(agentSmartAccountAddress);
      if (code !== '0x') {
        console.log('Smart account deployed successfully');
      } else {
        throw new Error('Smart account deployment failed, code is still empty (0x)');
      }
    } catch (error) {
      console.error('❌ Failed to deploy smart account:', error);
      throw error;
    }
  }

  console.log('Vincent Development Environment Setup Complete!');

  return {
    appId: registration.appId,
    appVersion: registration.appVersion,
    agentSignerAddress: pkpSignerAddress,
    agentSmartAccountAddress,
    userEoaAddress: wallets.userEoaWallet.address,
    accountIndexHash: registration.accountIndexHash,
    registrationTxHash: registration.txHash,
    rpcUrl: config.rpcUrl,
    chain: config.chain,
    wallets: {
      appManager: wallets.appManagerWallet,
      appDelegatee: wallets.appDelegateeWallet,
      userEoa: wallets.userEoaWallet,
      funder: wallets.funderWallet,
    },
    smartAccount,
  };
}

// Re-export types for convenience
export type { SetupConfig, VincentDevEnvironment, SmartAccountInfo } from './setup/types';
