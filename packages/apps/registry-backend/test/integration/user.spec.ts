import type { ConcurrentPayloadToSign } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types';
import bs58 from 'bs58';
import { Contract } from 'ethers';

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

const debug = createTestDebugger('user');

describe('User API Integration Tests', () => {
  let testAppId: number;
  let litContracts: LitContracts;

  // vincent-demo-ability v0.0.2 has this IPFS CID
  const abilityPackageName = 'vincent-demo-ability';
  const abilityVersion = '0.0.2';
  const abilityIpfsCid = 'QmdZcfgQ9Kz8vNwS5owf6iBm9Co1qMGki244JSFuyPNv1W';

  const appData = {
    name: 'User Test App',
    description: 'Test app for user integration tests',
    contactEmail: 'usertest@example.com',
    appUrl: 'https://example.com/userapp',
    logo: 'https://example.com/logo.png',
  };

  beforeAll(async () => {
    store.dispatch(api.util.resetApiState());

    // initialize LitContracts for permission verification
    litContracts = new LitContracts({
      signer: defaultWallet,
      network: 'datil',
    });
    await litContracts.connect();

    // 1. Create the ability in the database (fetches from npm, creates AbilityVersion with IPFS CID)
    //    If it already exists (409), that's fine - we can use the existing one
    const createAbilityResult = await store.dispatch(
      api.endpoints.createAbility.initiate({
        packageName: abilityPackageName,
        abilityCreate: {
          title: 'Test Ability for User Tests',
          description: 'Ability used for user integration tests',
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

    // 2. Create the app (also creates version 1)
    const createResult = await store.dispatch(
      api.endpoints.createApp.initiate({ appCreate: appData }),
    );
    if (hasError(createResult)) {
      console.error('createApp failed:', createResult.error);
    }
    expectAssertObject(createResult.data);
    testAppId = createResult.data.appId;
    debug({ testAppId, appName: createResult.data.name });

    // 3. Link the ability to app version 1 BEFORE registering on-chain
    const createAppVersionAbilityResult = await store.dispatch(
      api.endpoints.createAppVersionAbility.initiate({
        appId: testAppId,
        appVersion: 1,
        abilityPackageName: abilityPackageName,
        appVersionAbilityCreate: { abilityVersion },
      }),
    );
    if (hasError(createAppVersionAbilityResult)) {
      console.error('createAppVersionAbility failed:', createAppVersionAbilityResult.error);
    }
    expectAssertObject(createAppVersionAbilityResult.data);
    debug({ appVersionAbility: createAppVersionAbilityResult.data });

    // 4. Register the app on-chain (required before setting active version)
    const { txHash } = await getDefaultWalletContractClient().registerApp({
      appId: testAppId,
      delegateeAddresses: generateRandomEthAddresses(2),
      versionAbilities: {
        abilityIpfsCids: [abilityIpfsCid],
        abilityPolicies: [[]],
      },
    });
    debug({ registerAppTxHash: txHash });

    // 5. Set the active version (requires on-chain registration first)
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
  }, 120000);

  describe('POST /user/:appId/install-app', () => {
    // Shared state for the installation flow tests
    let installationData: {
      agentSignerAddress: string;
      agentSmartAccountAddress: string;
      appInstallationDataToSign: ConcurrentPayloadToSign;
    };

    it('should return agent addresses and data to sign for app installation', async () => {
      const result = await store.dispatch(
        api.endpoints.installApp.initiate({
          appId: testAppId,
          installAppRequest: { userControllerAddress: defaultWallet.address },
        }),
      );

      if (hasError(result)) {
        console.error('installApp failed:', result.error);
      }
      expectAssertObject(result.data);
      installationData = result.data as typeof installationData;

      expect(installationData).toHaveProperty('agentSignerAddress');
      expect(installationData).toHaveProperty('agentSmartAccountAddress');
      expect(installationData).toHaveProperty('appInstallationDataToSign');

      expect(installationData.agentSignerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(installationData.agentSmartAccountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(typeof installationData.appInstallationDataToSign).toBe('object');

      console.log(
        'appInstallationDataToSign:',
        JSON.stringify(installationData.appInstallationDataToSign, null, 2),
      );

      // Verify the ability IPFS CID was added as a permitted action on the PKP
      const pkpTokenId = await getPkpTokenId({
        pkpEthAddress: installationData.agentSignerAddress,
        signer: defaultWallet,
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

    it('should complete installation with signed typed data', async () => {
      expect(installationData).toBeDefined();

      const { appInstallationDataToSign } = installationData;
      const { typedData } = appInstallationDataToSign;

      // Sign the typed data with the user's wallet
      // Remove EIP712Domain from types as ethers adds it automatically
      const { EIP712Domain: _, ...types } = typedData.types;
      const typedDataSignature = await defaultWallet._signTypedData(
        typedData.domain,
        types,
        typedData.message,
      );

      console.log('Typed data signature:', typedDataSignature);

      // Complete the installation
      const completeResult = await store.dispatch(
        api.endpoints.completeInstallation.initiate({
          appId: testAppId,
          completeInstallationRequest: {
            typedDataSignature,
            appInstallationDataToSign,
          },
        }),
      );

      if (hasError(completeResult)) {
        console.error('completeInstallation failed:', completeResult.error);
      }
      expectAssertObject(completeResult.data);

      expect(completeResult.data).toHaveProperty('transactionHash');
      expect(completeResult.data.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      console.log('Installation transaction hash:', completeResult.data.transactionHash);

      debug({
        transactionHash: completeResult.data.transactionHash,
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

    it('should return 400 for missing userControllerAddress', async () => {
      const result = await store.dispatch(
        api.endpoints.installApp.initiate({
          appId: testAppId,
          // @ts-expect-error testing invalid input
          installAppRequest: {},
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for invalid userControllerAddress format', async () => {
      const result = await store.dispatch(
        api.endpoints.installApp.initiate({
          appId: testAppId,
          installAppRequest: { userControllerAddress: 'not-a-valid-address' },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 404 for non-existent app', async () => {
      const userControllerAddress = generateRandomEthAddresses(1)[0];
      const result = await store.dispatch(
        api.endpoints.installApp.initiate({
          appId: 999999999,
          installAppRequest: { userControllerAddress },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect([404, 500]).toContain(result.error.status);
      }
    });

    it('should return 400 for missing typedDataSignature in complete-installation', async () => {
      const result = await store.dispatch(
        api.endpoints.completeInstallation.initiate({
          appId: testAppId,
          // @ts-expect-error testing invalid input
          completeInstallationRequest: {
            appInstallationDataToSign: {},
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for missing appInstallationDataToSign in complete-installation', async () => {
      const result = await store.dispatch(
        api.endpoints.completeInstallation.initiate({
          appId: testAppId,
          // @ts-expect-error testing invalid input
          completeInstallationRequest: {
            typedDataSignature: '0x1234',
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });
  });

  describe('POST /user/:appId/agent-account', () => {
    it('should return the agent address for an installed app', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentAccount.initiate({
          appId: testAppId,
          getAgentAccountRequest: { userControllerAddress: defaultWallet.address },
        }),
      );

      if (hasError(result)) {
        console.error('getAgentAccount failed:', result.error);
      }
      expectAssertObject(result.data);

      expect(result.data).toHaveProperty('agentAddress');
      expect(result.data.agentAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      debug({
        agentAddress: result.data.agentAddress,
      });
    });

    it('should return null for a user that has not installed the app', async () => {
      const randomAddress = generateRandomEthAddresses(1)[0];
      const result = await store.dispatch(
        api.endpoints.getAgentAccount.initiate({
          appId: testAppId,
          getAgentAccountRequest: { userControllerAddress: randomAddress },
        }),
      );

      if (hasError(result)) {
        console.error('getAgentAccount failed:', result.error);
      }
      expectAssertObject(result.data);

      expect(result.data.agentAddress).toBeNull();

      debug({
        agentAddress: result.data.agentAddress,
      });
    });

    it('should return 400 for missing userControllerAddress', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentAccount.initiate({
          appId: testAppId,
          // @ts-expect-error testing invalid input
          getAgentAccountRequest: {},
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for invalid userControllerAddress format', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentAccount.initiate({
          appId: testAppId,
          getAgentAccountRequest: { userControllerAddress: 'not-a-valid-address' },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 404 for non-existent app', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentAccount.initiate({
          appId: 999999999,
          getAgentAccountRequest: { userControllerAddress: defaultWallet.address },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect([404, 500]).toContain(result.error.status);
      }
    });
  });
});
