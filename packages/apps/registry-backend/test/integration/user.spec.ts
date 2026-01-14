import type { ConcurrentPayloadToSign } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types';

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

const debug = createTestDebugger('user');

// Helper to avoid Gelato rate limiting between relay calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('User API Integration Tests', () => {
  let testAppId: number;
  let litContracts: LitContracts;
  let litSigner: Wallet;

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

    it('should complete installation with signed typed data', async () => {
      expect(installationData).toBeDefined();

      const { appInstallationDataToSign } = installationData;
      const { typedData } = appInstallationDataToSign;

      // Sign the typed data with the user's wallet
      // Remove EIP712Domain from types as ethers adds it automatically
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  describe('POST /user/:appId/uninstall-app and reinstall via install-app', () => {
    // Shared state for the uninstall/reinstall flow tests
    let agentSmartAccountAddress: string;
    let uninstallDataToSign: any;

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

    it('should return data to sign for uninstalling an app', async () => {
      const result = await store.dispatch(
        api.endpoints.uninstallApp.initiate({
          appId: testAppId,
          uninstallAppRequest: {
            appVersion: 1,
            userControllerAddress: defaultWallet.address,
          },
        }),
      );

      if (hasError(result)) {
        console.error('uninstallApp failed:', result.error);
      }
      expectAssertObject(result.data);

      expect(result.data).toHaveProperty('uninstallDataToSign');
      expect(typeof result.data.uninstallDataToSign).toBe('object');

      uninstallDataToSign = result.data.uninstallDataToSign;

      debug({
        uninstallDataToSign: JSON.stringify(uninstallDataToSign, null, 2),
      });
    }, 60000);

    it('should complete uninstall with signed typed data', async () => {
      expect(uninstallDataToSign).toBeDefined();

      const { typedData } = uninstallDataToSign;

      // Sign the typed data with the user's wallet
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { EIP712Domain: _, ...types } = typedData.types;
      const typedDataSignature = await defaultWallet._signTypedData(
        typedData.domain,
        types,
        typedData.message,
      );

      console.log('Uninstall typed data signature:', typedDataSignature);

      // Wait to avoid Gelato rate limiting (Gelato has strict per-account limits)
      console.log('Waiting 60s to avoid Gelato rate limiting...');
      await delay(60000);

      // Complete the uninstall
      const completeResult = await store.dispatch(
        api.endpoints.completeUninstall.initiate({
          appId: testAppId,
          completeUninstallRequest: {
            typedDataSignature,
            uninstallDataToSign,
          },
        }),
      );

      if (hasError(completeResult)) {
        console.error('completeUninstall failed:', completeResult.error);
      }
      expectAssertObject(completeResult.data);

      expect(completeResult.data).toHaveProperty('transactionHash');
      expect(completeResult.data.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      console.log('Uninstall transaction hash:', completeResult.data.transactionHash);

      debug({
        transactionHash: completeResult.data.transactionHash,
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

    it('should return data to sign for repermitting an app via install-app', async () => {
      // After unpermitting, calling install-app should detect the unpermitted state
      // and return repermit data instead of minting a new PKP
      const result = await store.dispatch(
        api.endpoints.installApp.initiate({
          appId: testAppId,
          installAppRequest: {
            userControllerAddress: defaultWallet.address,
          },
        }),
      );

      if (hasError(result)) {
        console.error('installApp (repermit) failed:', result.error);
      }
      expectAssertObject(result.data);

      expect(result.data).toHaveProperty('agentSignerAddress');
      expect(result.data).toHaveProperty('agentSmartAccountAddress');
      expect(result.data).toHaveProperty('appInstallationDataToSign');
      expect(typeof result.data.appInstallationDataToSign).toBe('object');

      // Store for the next test
      (global as any).repermitInstallationData = result.data;

      debug({
        agentSignerAddress: result.data.agentSignerAddress,
        agentSmartAccountAddress: result.data.agentSmartAccountAddress,
        appInstallationDataToSign: JSON.stringify(result.data.appInstallationDataToSign, null, 2),
      });
    }, 60000);

    it('should complete repermit with signed typed data via complete-installation', async () => {
      const repermitInstallationData = (global as any).repermitInstallationData;
      expect(repermitInstallationData).toBeDefined();

      const { appInstallationDataToSign } = repermitInstallationData;
      const { typedData } = appInstallationDataToSign;

      // Sign the typed data with the user's wallet
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { EIP712Domain: _, ...types } = typedData.types;
      const typedDataSignature = await defaultWallet._signTypedData(
        typedData.domain,
        types,
        typedData.message,
      );

      console.log('Repermit typed data signature:', typedDataSignature);

      // Wait to avoid Gelato rate limiting (Gelato has strict per-account limits)
      console.log('Waiting 60s to avoid Gelato rate limiting...');
      await delay(60000);

      // Complete the repermit using the standard complete-installation endpoint
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
        console.error('completeInstallation (repermit) failed:', completeResult.error);
      }
      expectAssertObject(completeResult.data);

      expect(completeResult.data).toHaveProperty('transactionHash');
      expect(completeResult.data.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      console.log('Repermit transaction hash:', completeResult.data.transactionHash);

      debug({
        transactionHash: completeResult.data.transactionHash,
      });
    }, 120000);

    it('should have the app permitted again on the Vincent contract after repermit', async () => {
      // Query the Vincent contract to verify the app was repermitted
      const vincentContract = new Contract(
        VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
        COMBINED_ABI,
        defaultWallet.provider,
      );

      const results = await vincentContract.getPermittedAppForAgents([agentSmartAccountAddress]);

      console.log(
        'getPermittedAppForAgents results after repermit:',
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
