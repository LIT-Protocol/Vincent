import bs58 from 'bs58';
import { Contract, providers, Wallet } from 'ethers';

import { LitContracts } from '@lit-protocol/contracts-sdk';
import {
  getPkpTokenId,
  COMBINED_ABI,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from '@lit-protocol/vincent-contracts-sdk';

import { expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import {
  api,
  store,
  generateRandomEthAddresses,
  getDefaultWalletContractClient,
  defaultWallet,
} from './setup';

const debug = createTestDebugger('user-direct-submission');

/**
 * These tests verify the direct EOA submission flow (sponsorGas: false).
 * Instead of using Gelato relay for gas sponsorship, the user submits
 * transactions directly and pays their own gas.
 *
 * This is useful for development/testing to avoid Gelato rate limits.
 */
describe('User API Integration Tests (Direct EOA Submission)', () => {
  let testAppId: number;
  let litContracts: LitContracts;
  let litSigner: Wallet;

  // vincent-demo-ability v0.0.2 has this IPFS CID
  const abilityPackageName = 'vincent-demo-ability';
  const abilityVersion = '0.0.2';
  const abilityIpfsCid = 'QmdZcfgQ9Kz8vNwS5owf6iBm9Co1qMGki244JSFuyPNv1W';

  const appData = {
    name: 'User Direct Submission Test App',
    description: 'Test app for user integration tests with direct EOA submission',
    contactEmail: 'usertest-direct@example.com',
    appUrl: 'https://example.com/userapp-direct',
    logo: 'https://example.com/logo.png',
  };

  beforeAll(async () => {
    store.dispatch(api.util.resetApiState());

    // Initialize LitContracts for permission verification
    // Use a signer connected to Chronicle Yellowstone (Lit's network), not Base Sepolia
    const litProvider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com/');
    litSigner = new Wallet(
      process.env['TEST_APP_MANAGER_PRIVATE_KEY'] ||
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      litProvider,
    );
    litContracts = new LitContracts({
      signer: litSigner,
      network: 'datil',
    });
    await litContracts.connect();

    // 1. Create the ability in the database (fetches from npm, creates AbilityVersion with IPFS CID)
    //    If it already exists (409), that's fine - we can use the existing one
    const createAbilityResult = await store.dispatch(
      api.endpoints.createAbility.initiate({
        packageName: abilityPackageName,
        abilityCreate: {
          title: 'Test Ability for Direct Submission Tests',
          description: 'Ability used for user integration tests with direct EOA submission',
          activeVersion: abilityVersion,
        },
      }),
    );
    if (hasError(createAbilityResult)) {
      // @ts-expect-error accessing error status
      if (createAbilityResult.error.status !== 409) {
        console.error('createAbility failed:', createAbilityResult.error);
        throw new Error('Failed to create ability');
      }
      debug({ abilityPackageName, message: 'Ability already exists, continuing' });
    } else {
      debug({ abilityPackageName: createAbilityResult.data?.packageName });
    }

    // 2. Register the app on-chain FIRST to get the contract-generated appId
    //    Note: This creates version 1 on-chain immediately
    const { txHash, appId } = await getDefaultWalletContractClient().registerApp({
      delegateeAddresses: generateRandomEthAddresses(2),
      versionAbilities: {
        abilityIpfsCids: [abilityIpfsCid],
        abilityPolicies: [[]],
      },
    });
    testAppId = appId;
    console.log('registerApp result:', { txHash, testAppId });
    debug({ registerAppTxHash: txHash, testAppId });

    // Wait a bit for RPC propagation
    console.log('Waiting 3s for RPC propagation...');
    await new Promise((r) => setTimeout(r, 3000));

    // 3. Create the app in the backend using the on-chain appId
    const createResult = await store.dispatch(
      api.endpoints.createApp.initiate({
        appCreate: {
          ...appData,
          appId: testAppId,
        },
      }),
    );
    if (hasError(createResult)) {
      console.error('createApp failed:', createResult.error);
    }
    expectAssertObject(createResult.data);
    debug({ appCreated: testAppId });

    // 4. Link the ability to version 1 in the backend database
    //    (Abilities are fetched from on-chain, but we still create the link for completeness)
    const createAbilityLinkResult = await store.dispatch(
      api.endpoints.createAppVersionAbility.initiate({
        appId: testAppId,
        appVersion: 1,
        abilityPackageName: abilityPackageName,
        appVersionAbilityCreate: {
          abilityVersion: abilityVersion,
        },
      }),
    );
    if (hasError(createAbilityLinkResult)) {
      console.error('createAppVersionAbility failed:', createAbilityLinkResult.error);
    }
    expectAssertObject(createAbilityLinkResult.data);
    debug({ abilityLinked: abilityPackageName });

    // 5. Set the active version to 1
    const setActiveResult = await store.dispatch(
      api.endpoints.setAppActiveVersion.initiate({
        appId: testAppId,
        appSetActiveVersion: { activeVersion: 1 },
      }),
    );

    if (hasError(setActiveResult)) {
      console.error('setAppActiveVersion failed:', setActiveResult.error);
    }
    expectAssertObject(setActiveResult.data);
  }, 180000);

  describe('POST /user/:appId/install-app (sponsorGas: false)', () => {
    // Shared state for the installation flow tests
    let installationData: {
      agentSignerAddress: string;
      agentSmartAccountAddress: string;
      rawTransaction: { to: string; data: string };
    };

    it('should return agent addresses and raw transaction for app installation', async () => {
      const result = await store.dispatch(
        api.endpoints.installApp.initiate({
          appId: testAppId,
          installAppRequest: {
            userControllerAddress: defaultWallet.address,
            sponsorGas: false, // Use direct EOA submission instead of Gelato relay
          },
        }),
      );

      if (hasError(result)) {
        console.error('installApp failed:', result.error);
      }
      expectAssertObject(result.data);
      installationData = result.data as typeof installationData;

      expect(installationData).toHaveProperty('agentSignerAddress');
      expect(installationData).toHaveProperty('agentSmartAccountAddress');
      expect(installationData).toHaveProperty('rawTransaction');

      expect(installationData.agentSignerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(installationData.agentSmartAccountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(typeof installationData.rawTransaction).toBe('object');
      expect(installationData.rawTransaction).toHaveProperty('to');
      expect(installationData.rawTransaction).toHaveProperty('data');

      console.log('rawTransaction:', JSON.stringify(installationData.rawTransaction, null, 2));

      // Verify the ability IPFS CID was added as a permitted action on the PKP
      // Use litSigner (connected to Chronicle Yellowstone) since PKP contracts are on Lit's network
      const pkpTokenId = await getPkpTokenId({
        pkpEthAddress: installationData.agentSignerAddress,
        signer: litSigner,
      });

      console.log('PKP Token ID:', pkpTokenId.toString());
      console.log('Expected IPFS CID:', abilityIpfsCid);

      const permittedActions =
        await litContracts.pkpPermissionsContractUtils.read.getPermittedActions(
          pkpTokenId.toString(),
        );
      // Decode hex to base58 IPFS CIDs for visual confirmation
      const decodedActions = permittedActions.map((hex: string) => {
        const bytes = Buffer.from(hex.slice(2), 'hex');
        return bs58.encode(bytes);
      });
      console.log('Permitted actions on-chain (base58):', decodedActions);

      const isPermitted = await litContracts.pkpPermissionsContractUtils.read.isPermittedAction(
        pkpTokenId.toString(),
        abilityIpfsCid,
      );
      console.log('Is expected IPFS CID permitted:', isPermitted);

      expect(isPermitted).toBe(true);

      debug({
        agentSignerAddress: installationData.agentSignerAddress,
        agentSmartAccountAddress: installationData.agentSmartAccountAddress,
        pkpTokenId: pkpTokenId.toString(),
        abilityIpfsCidPermitted: isPermitted,
      });
    }, 60000);

    it('should complete installation by submitting raw transaction directly', async () => {
      expect(installationData).toBeDefined();

      const { rawTransaction } = installationData;

      // Submit the raw transaction directly using the user's wallet (no Gelato relay)
      console.log('Submitting raw transaction to:', rawTransaction.to);

      const tx = await defaultWallet.sendTransaction({
        to: rawTransaction.to,
        data: rawTransaction.data,
      });

      console.log('Installation transaction hash:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Installation transaction confirmed in block:', receipt.blockNumber);

      expect(tx.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(receipt.status).toBe(1);

      // Wait for RPC state propagation
      console.log('Waiting 5s for RPC state propagation...');
      await new Promise((r) => setTimeout(r, 5000));

      debug({
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });
    }, 120000);

    it('should have the app permitted on the Vincent contract after installation', async () => {
      expect(installationData).toBeDefined();

      // Query the Vincent contract to verify the app was permitted
      const vincentContract = new Contract(
        VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
        COMBINED_ABI,
        defaultWallet.provider,
      );

      const results = await vincentContract.getPermittedAppForAgents([
        installationData.agentSmartAccountAddress,
      ]);

      console.log('getPermittedAppForAgents results:', JSON.stringify(results, null, 2));

      expect(results).toHaveLength(1);
      const [agentResult] = results;

      // Verify the agent address matches
      expect(agentResult.agentAddress.toLowerCase()).toBe(
        installationData.agentSmartAccountAddress.toLowerCase(),
      );

      // Verify the permitted app details
      const { permittedApp } = agentResult;
      expect(Number(permittedApp.appId)).toBe(testAppId);
      expect(Number(permittedApp.version)).toBe(1);
      expect(permittedApp.pkpSigner.toLowerCase()).toBe(
        installationData.agentSignerAddress.toLowerCase(),
      );
      expect(permittedApp.versionEnabled).toBe(true);
      expect(permittedApp.isDeleted).toBe(false);

      debug({
        agentAddress: agentResult.agentAddress,
        appId: Number(permittedApp.appId),
        version: Number(permittedApp.version),
        pkpSigner: permittedApp.pkpSigner,
        versionEnabled: permittedApp.versionEnabled,
      });
    }, 30000);
  });

  describe('POST /user/:appId/uninstall-app and reinstall (sponsorGas: false)', () => {
    // Shared state for the uninstall/reinstall flow tests
    let agentSmartAccountAddress: string;
    let uninstallRawTransaction: { to: string; data: string };

    beforeAll(async () => {
      // Get the agent address from a previous installation
      const agentResult = await store.dispatch(
        api.endpoints.getAgentAccount.initiate({
          appId: testAppId,
          getAgentAccountRequest: { userControllerAddress: defaultWallet.address },
        }),
      );

      if (hasError(agentResult)) {
        throw new Error('Failed to get agent account');
      }
      expectAssertObject(agentResult.data);
      agentSmartAccountAddress = agentResult.data.agentAddress as string;
      expect(agentSmartAccountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return raw transaction for uninstalling an app', async () => {
      const result = await store.dispatch(
        api.endpoints.uninstallApp.initiate({
          appId: testAppId,
          uninstallAppRequest: {
            appVersion: 1,
            userControllerAddress: defaultWallet.address,
            sponsorGas: false, // Use direct EOA submission instead of Gelato relay
          },
        }),
      );

      if (hasError(result)) {
        console.error('uninstallApp failed:', result.error);
      }
      expectAssertObject(result.data);

      expect(result.data).toHaveProperty('rawTransaction');
      expect(typeof result.data.rawTransaction).toBe('object');
      expect(result.data.rawTransaction).toHaveProperty('to');
      expect(result.data.rawTransaction).toHaveProperty('data');

      uninstallRawTransaction = result.data.rawTransaction as typeof uninstallRawTransaction;

      debug({
        rawTransaction: JSON.stringify(uninstallRawTransaction, null, 2),
      });
    }, 60000);

    it('should complete uninstall by submitting raw transaction directly', async () => {
      expect(uninstallRawTransaction).toBeDefined();

      // Submit the raw transaction directly using the user's wallet (no Gelato relay)
      console.log('Submitting uninstall raw transaction to:', uninstallRawTransaction.to);

      const tx = await defaultWallet.sendTransaction({
        to: uninstallRawTransaction.to,
        data: uninstallRawTransaction.data,
      });

      console.log('Uninstall transaction hash:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Uninstall transaction confirmed in block:', receipt.blockNumber);

      expect(tx.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(receipt.status).toBe(1);

      // Wait for RPC state propagation
      console.log('Waiting 5s for RPC state propagation...');
      await new Promise((r) => setTimeout(r, 5000));

      debug({
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });
    }, 120000);

    it('should have the app uninstalled on the Vincent contract after uninstall', async () => {
      // Query the Vincent contract to verify the app was uninstalled
      const vincentContract = new Contract(
        VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
        COMBINED_ABI,
        defaultWallet.provider,
      );

      const results = await vincentContract.getPermittedAppForAgents([agentSmartAccountAddress]);

      console.log(
        'getPermittedAppForAgents results after uninstall:',
        JSON.stringify(results, null, 2),
      );

      expect(results).toHaveLength(1);
      const [agentResult] = results;

      // Verify the agent address matches
      expect(agentResult.agentAddress.toLowerCase()).toBe(agentSmartAccountAddress.toLowerCase());

      // Verify the app is no longer permitted (appId should be 0 or version should be 0)
      const { permittedApp } = agentResult;
      expect(Number(permittedApp.appId)).toBe(0);
      expect(Number(permittedApp.version)).toBe(0);

      debug({
        agentAddress: agentResult.agentAddress,
        appId: Number(permittedApp.appId),
        version: Number(permittedApp.version),
      });
    }, 30000);

    it('should return raw transaction for reinstalling an app via install-app', async () => {
      // After uninstalling, calling install-app should detect the uninstalled state
      // and return reinstall data instead of minting a new PKP
      const result = await store.dispatch(
        api.endpoints.installApp.initiate({
          appId: testAppId,
          installAppRequest: {
            userControllerAddress: defaultWallet.address,
            sponsorGas: false, // Use direct EOA submission instead of Gelato relay
          },
        }),
      );

      if (hasError(result)) {
        console.error('installApp (reinstall) failed:', result.error);
      }
      expectAssertObject(result.data);

      expect(result.data).toHaveProperty('agentSignerAddress');
      expect(result.data).toHaveProperty('agentSmartAccountAddress');
      expect(result.data).toHaveProperty('rawTransaction');
      expect(typeof result.data.rawTransaction).toBe('object');

      // Store for the next test
      (global as any).reinstallData = result.data;

      debug({
        agentSignerAddress: result.data.agentSignerAddress,
        agentSmartAccountAddress: result.data.agentSmartAccountAddress,
        rawTransaction: JSON.stringify(result.data.rawTransaction, null, 2),
      });
    }, 60000);

    it('should complete reinstall by submitting raw transaction directly', async () => {
      const reinstallData = (global as any).reinstallData as {
        rawTransaction: { to: string; data: string };
      };
      expect(reinstallData).toBeDefined();

      const { rawTransaction } = reinstallData;

      // Submit the raw transaction directly using the user's wallet (no Gelato relay)
      console.log('Submitting reinstall raw transaction to:', rawTransaction.to);

      const tx = await defaultWallet.sendTransaction({
        to: rawTransaction.to,
        data: rawTransaction.data,
      });

      console.log('Reinstall transaction hash:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Reinstall transaction confirmed in block:', receipt.blockNumber);

      expect(tx.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(receipt.status).toBe(1);

      // Wait for RPC state propagation
      console.log('Waiting 5s for RPC state propagation...');
      await new Promise((r) => setTimeout(r, 5000));

      debug({
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });
    }, 120000);

    it('should have the app permitted again on the Vincent contract after reinstall', async () => {
      // Query the Vincent contract to verify the app was reinstalled
      const vincentContract = new Contract(
        VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
        COMBINED_ABI,
        defaultWallet.provider,
      );

      const results = await vincentContract.getPermittedAppForAgents([agentSmartAccountAddress]);

      console.log(
        'getPermittedAppForAgents results after reinstall:',
        JSON.stringify(results, null, 2),
      );

      expect(results).toHaveLength(1);
      const [agentResult] = results;

      // Verify the agent address matches
      expect(agentResult.agentAddress.toLowerCase()).toBe(agentSmartAccountAddress.toLowerCase());

      // Verify the permitted app details are restored
      const { permittedApp } = agentResult;
      expect(Number(permittedApp.appId)).toBe(testAppId);
      expect(Number(permittedApp.version)).toBe(1);
      expect(permittedApp.versionEnabled).toBe(true);
      expect(permittedApp.isDeleted).toBe(false);

      debug({
        agentAddress: agentResult.agentAddress,
        appId: Number(permittedApp.appId),
        version: Number(permittedApp.version),
        versionEnabled: permittedApp.versionEnabled,
      });
    }, 30000);
  });
});
