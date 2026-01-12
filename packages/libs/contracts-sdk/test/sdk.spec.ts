import { ethers } from 'ethers';

import type { PermissionData } from '../src/types';
import type { TestConfig, TestContextState } from './helpers';

import { VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD } from '../src/constants';
import { getTestClient } from '../src/index';
import { expectAssertArray, expectAssertObject } from './assertions';
import {
  BASE_SEPOLIA_RPC_URL,
  MIN_BASE_SEPOLIA_BALANCE,
  REFUND_BUFFER,
  TARGET_BASE_SEPOLIA_BALANCE,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  TEST_APP_DELEGATEE_SIGNER,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  createBalanceManager,
  createTestContext,
  getTestFlags,
  saveTestConfig,
} from './helpers';
import { generateRandomIpfsCid, removeAppDelegateeIfNeeded } from './helpers/setup-fixtures';
import { logTxEvents, requireValue, waitForValue } from './helpers/test-utils';

// Extend Jest timeout to 2 minutes
jest.setTimeout(120000);

const {
  shouldRefund,
  shouldResetPkp,
  shouldFreshState,
  testState: resolvedTestState,
} = getTestFlags();

type AppAbility = {
  abilityIpfsCid: string;
  policyIpfsCids: string[];
};

describe('Vincent Contracts SDK E2E', () => {
  let skipRegisterApp = false;
  let registeredAccountIndexHash: string | null = null;
  let expectedPermissionData: PermissionData | null = null;
  let balanceManager: ReturnType<typeof createBalanceManager> | null = null;
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  const testState: TestContextState = {
    testConfig: {} as TestConfig,
    appClient: {} as ReturnType<typeof getTestClient>,
    userClient: {} as ReturnType<typeof getTestClient>,
    provider: {} as ethers.providers.JsonRpcProvider,
    delegateeAddress: '',
    abilityIpfsCids: [],
    abilityPolicies: [],
    agentAddress: '',
    pkpSignerPubkey: '',
  };

  const getAppId = () => requireValue(testState.testConfig.appId, 'testConfig.appId');
  const getAppVersion = () =>
    requireValue(testState.testConfig.appVersion, 'testConfig.appVersion');
  const getPkpSigner = () =>
    requireValue(testState.testConfig.userPkp?.ethAddress, 'testConfig.userPkp.ethAddress');

  beforeAll(async () => {
    console.log(`ℹ️  Test state: ${resolvedTestState}`);
    // 1) Initialise config + PKP + smart account + provider so that test state is ready before on-chain calls.
    testContext = await createTestContext({
      state: testState,
      testConfigPath: TEST_CONFIG_PATH,
      shouldResetPkp,
      baseSepoliaRpcUrl: BASE_SEPOLIA_RPC_URL,
      appManagerPrivateKey: TEST_APP_MANAGER_PRIVATE_KEY,
      userPrivateKey: TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,

      // Prefer the Base Sepolia-specific funder key, fall back to the shared test funder key.
      funderPrivateKey:
        process.env.TEST_BASE_SEPOLIA_PRIVATE_KEY || process.env.TEST_FUNDER_PRIVATE_KEY,
      delegateeAddress: TEST_APP_DELEGATEE_SIGNER.address,
    });
    const { appManagerSigner, userSigner } = testContext;

    // 2) Ensure funding for write calls so that Base Sepolia transactions can be submitted and refunded.
    balanceManager = createBalanceManager({
      provider: testState.provider,
      funder: testContext.funderSigner,
      minBalance: MIN_BASE_SEPOLIA_BALANCE,
      targetBalance: TARGET_BASE_SEPOLIA_BALANCE,
      refundBuffer: REFUND_BUFFER,
      shouldRefund: shouldRefund,
    });
    await balanceManager.ensureBalance({ signer: appManagerSigner, label: 'app manager' });
    await balanceManager.ensureBalance({ signer: userSigner, label: 'user signer' });

    // 3) Log network + diamond info so that failures can be traced to the chain configuration.
    const network = await testState.provider.getNetwork();
    const diamondCode = await testState.provider.getCode(VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD);
    console.log(
      `ℹ️  Connected to chain ${network.chainId} (${network.name}), diamond ${VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD}, code bytes ${diamondCode.length}`,
    );

    // 4) Load existing app state or seed new abilities so that tests stay deterministic across reruns.
    // Scenarios:
    //   - TEST_STATE=fresh: force clean slate for delegatee + PKP.
    //   - TEST_STATE=reuse: reuse on-chain state to avoid stale expectations.
    //   - No existing app: seed abilities/policies to register a new app.
    // TEST_STATE=fresh clears saved app/version, removes delegatee, and reseeds abilities.
    if (shouldFreshState) {
      await removeAppDelegateeIfNeeded(testState.delegateeAddress as `0x${string}`);
      testState.testConfig.appId = null;
      testState.testConfig.appVersion = null;
      registeredAccountIndexHash = null;
      saveTestConfig(TEST_CONFIG_PATH, testState.testConfig);
      testState.abilityIpfsCids = [generateRandomIpfsCid(), generateRandomIpfsCid()];
      testState.abilityPolicies = [
        [generateRandomIpfsCid()], // Policy for first ability
        [generateRandomIpfsCid(), generateRandomIpfsCid()], // Policies for second ability
      ];
      return;
    }
    // Delegatee -> app lookup flow:
    //   [delegatee] --getAppByDelegateeAddress--> [app?]
    //     | yes -> (undelete if needed) -> sync test config -> load app state -> skip registerApp
    //     | no  -> cleanup delegatee -> seed abilities/policies for new app registration
    const existingApp = await testState.appClient.getAppByDelegateeAddress({
      delegateeAddress: testState.delegateeAddress,
    });
    if (existingApp) {
      if (existingApp.isDeleted) {
        await testState.appClient.undeleteApp({ appId: existingApp.id });
      }
      testState.testConfig.appId = existingApp.id;
      testState.testConfig.appVersion = existingApp.latestVersion;
      registeredAccountIndexHash = existingApp.accountIndexHash ?? null;
      saveTestConfig(TEST_CONFIG_PATH, testState.testConfig);
      skipRegisterApp = true;
      await testContext.loadExistingAppState({
        appId: existingApp.id,
        appVersion: existingApp.latestVersion,
      });
    } else {
      await removeAppDelegateeIfNeeded(testState.delegateeAddress as `0x${string}`);
      testState.abilityIpfsCids = [generateRandomIpfsCid(), generateRandomIpfsCid()];
      testState.abilityPolicies = [
        [generateRandomIpfsCid()], // Policy for first ability
        [generateRandomIpfsCid(), generateRandomIpfsCid()], // Policies for second ability
      ];
    }
  });

  afterAll(async () => {
    // Clean up: remove the delegatee if needed
    let cleanupWarning: string | null = null;
    try {
      await removeAppDelegateeIfNeeded(testState.delegateeAddress as `0x${string}`);
    } catch (error: unknown) {
      cleanupWarning = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  Cleanup warning: ${cleanupWarning}`);
    }

    if (balanceManager) {
      try {
        await balanceManager.refundAll();
      } catch (error: unknown) {
        const refundWarning = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  Refund warning: ${refundWarning}`);
      }
    }

    if (!cleanupWarning) {
      console.log('✅ Test cleanup completed');
    }
  });

  describe('App Management', () => {
    it('should register a new Vincent app with abilities and policies', async () => {
      if (skipRegisterApp) {
        console.log(
          `ℹ️  Delegatee already registered to App ID ${testState.testConfig.appId}. Skipping registerApp.`,
        );
        return;
      }
      const { txHash, appId, newAppVersion, accountIndexHash } =
        await testState.appClient.registerApp({
          delegateeAddresses: [testState.delegateeAddress],
          versionAbilities: {
            abilityIpfsCids: testState.abilityIpfsCids,
            abilityPolicies: testState.abilityPolicies,
          },
        });
      expect(txHash).toBeTruthy();
      expect(accountIndexHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
      registeredAccountIndexHash = accountIndexHash;
      await logTxEvents({ provider: testState.provider, txHash, label: 'registerApp' });
      // Update test config
      testState.testConfig.appId = appId;
      testState.testConfig.appVersion = newAppVersion;
      saveTestConfig(TEST_CONFIG_PATH, testState.testConfig);
      console.log(
        `✅ Registered new App with ID: ${testState.testConfig.appId}\nTx hash: ${txHash}`,
      );
    });

    it('should retrieve app details by ID', async () => {
      const app = await waitForValue(
        () =>
          testState.appClient.getAppById({
            appId: getAppId(),
          }),
        (value) =>
          value !== null &&
          Number(value.latestVersion) === testState.testConfig.appVersion &&
          value.delegateeAddresses.includes(testState.delegateeAddress),
        { label: 'getAppById' },
      );
      if (app === null) {
        throw new Error('App not found');
      }
      expect(app).toBeTruthy();
      expect(Number(app.id)).toBe(testState.testConfig.appId);
      expect(app.isDeleted).toBe(false);
      expect(Number(app.latestVersion)).toBe(testState.testConfig.appVersion);
      expect(app.delegateeAddresses).toContain(testState.delegateeAddress);
      expect(app.accountIndexHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
      if (registeredAccountIndexHash) {
        expect(app.accountIndexHash).toBe(registeredAccountIndexHash);
      }
    });

    it('should retrieve app by delegatee address', async () => {
      const app = await waitForValue(
        () =>
          testState.appClient.getAppByDelegateeAddress({
            delegateeAddress: testState.delegateeAddress,
          }),
        (value) =>
          value !== null &&
          Number(value.latestVersion) === testState.testConfig.appVersion &&
          value.delegateeAddresses.includes(testState.delegateeAddress),
        { label: 'getAppByDelegateeAddress' },
      );
      if (app === null) {
        throw new Error('App not found');
      }
      expect(app).toBeTruthy();
      expect(Number(app.id)).toBe(testState.testConfig.appId);
      expect(app.isDeleted).toBe(false);
      expect(app.manager).toBe(testContext.appManagerSigner.address);
      expect(Number(app.latestVersion)).toBe(testState.testConfig.appVersion);
      expect(app.delegateeAddresses).toContain(testState.delegateeAddress);
    });

    it('should get app ID by delegatee', async () => {
      const appId = await waitForValue(
        () =>
          testState.appClient.getAppIdByDelegatee({
            delegateeAddress: testState.delegateeAddress,
          }),
        (value) => value !== null && Number(value) === testState.testConfig.appId,
        { label: 'getAppIdByDelegatee' },
      );
      expect(Number(appId)).toBe(testState.testConfig.appId);
    });

    it('should return null for non-registered delegatee', async () => {
      const nonRegisteredDelegatee = ethers.Wallet.createRandom().address;
      const result = await testState.appClient.getAppIdByDelegatee({
        delegateeAddress: nonRegisteredDelegatee,
      });
      expect(result).toBe(null);
    });

    it('should get all apps by manager', async () => {
      const fetchAppsByManager = async () => {
        const PAGE_SIZE = 50;
        let offset = 0;
        let testApp: { id: number | string } | undefined;
        let allApps: Array<{ id: number | string }> = [];

        // Keep querying until we find the app or reach the last page
        while (true) {
          const result = await testState.appClient.getAppsByManagerAddress({
            managerAddress: testContext.appManagerSigner.address,
            offset: offset.toString(),
          });

          console.log(
            `Page ${Math.floor(offset / PAGE_SIZE) + 1}: Found ${result.length} apps (offset: ${offset})`,
          );
          allApps = [...allApps, ...result];

          // Look for our test app in this batch
          testApp = result.find((app) => Number(app.id) === testState.testConfig.appId);
          if (testApp) {
            console.log(
              `Found test app with ID ${testState.testConfig.appId} on page ${Math.floor(offset / PAGE_SIZE) + 1}`,
            );
            break;
          }

          // If we got less than PAGE_SIZE results, we've reached the last page
          if (result.length < PAGE_SIZE) {
            console.log(`Reached last page. Total apps searched: ${allApps.length}`);
            break;
          }

          // Move to next page
          offset += PAGE_SIZE;
        }

        return { allApps, testApp };
      };

      const { allApps, testApp } = await waitForValue(
        fetchAppsByManager,
        (value) => Boolean(value.testApp),
        { label: 'getAppsByManager' },
      );

      console.log(`Manager address: ${testContext.appManagerSigner.address}`);
      console.log(
        `Looking for app ID: ${testState.testConfig.appId} (type: ${typeof testState.testConfig.appId})`,
      );
      console.log(`Total apps found for manager: ${allApps.length}`);

      expect(allApps.length).toBeGreaterThan(0);
      expect(testApp).toBeDefined();
    });
  });

  describe('PKP Permissions', () => {
    it('should permit app version for PKP', async () => {
      const permissionData = testContext.buildPermissionData();
      expectedPermissionData = permissionData;
      const attemptPermit = async () =>
        testState.userClient.permitApp({
          agentAddress: testState.agentAddress,
          pkpSigner: getPkpSigner(),
          pkpSignerPubKey: testState.pkpSignerPubkey,
          appId: getAppId(),
          appVersion: getAppVersion(),
          permissionData,
        });

      try {
        const result = await attemptPermit();
        expect(result).toHaveProperty('txHash');
        await logTxEvents({
          provider: testState.provider,
          txHash: result.txHash,
          label: 'permitApp',
        });
        await testContext.syncTestConfigForVersion({
          appId: getAppId(),
          appVersion: getAppVersion(),
          reason: 'permitApp',
        });
        console.log(
          `✅ Permitted App ID ${testState.testConfig.appId} version ${testState.testConfig.appVersion} for Agent ${testState.agentAddress}\nTx hash: ${result.txHash}`,
        );
        return;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes('PkpSignerAlreadyRegisteredToAgent') ||
          message.includes('AppVersionAlreadyPermitted')
        ) {
          const existingPermittedApp = await testContext.readPermittedApp({
            requirePermitted: false,
            label: 'getPermittedAppForAgents after permit failure',
          });

          if (existingPermittedApp) {
            expectedPermissionData = null;
            await testContext.ensureDelegateeForApp(existingPermittedApp.appId);
            console.log(
              `ℹ️  Using existing permitted app version ${existingPermittedApp.version} for Agent ${testState.agentAddress}`,
            );
            return;
          }

          console.log(
            'ℹ️  PKP signer already registered to another agent. Minting a fresh PKP to continue...',
          );
          await testContext.refreshTestPkp();
          const retryResult = await attemptPermit();
          expect(retryResult).toHaveProperty('txHash');
          await logTxEvents({
            provider: testState.provider,
            txHash: retryResult.txHash,
            label: 'permitApp',
          });
          await testContext.syncTestConfigForVersion({
            appId: getAppId(),
            appVersion: getAppVersion(),
            reason: shouldResetPkp ? 'permitApp retry (reset)' : 'permitApp retry (auto reset)',
          });
          console.log(
            `✅ Permitted App ID ${testState.testConfig.appId} version ${testState.testConfig.appVersion} for Agent ${testState.agentAddress}\nTx hash: ${retryResult.txHash}`,
          );
          return;
        }
        throw error;
      }
    });

    it('should get permitted app for agent', async () => {
      const result = await waitForValue(
        () =>
          testState.userClient.getPermittedAppForAgents({
            agentAddresses: [testState.agentAddress],
          }),
        (value) => value[0]?.permittedApp !== null,
        { label: 'getPermittedAppForAgents' },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('agentAddress');
      expect(result[0].agentAddress).toBe(testState.agentAddress);

      expect(result[0]).toHaveProperty('permittedApp');
      expect(result[0].permittedApp).not.toBeNull();

      const permittedApp = result[0].permittedApp;
      if (!permittedApp) {
        throw new Error('Permitted app not found');
      }
      expect(permittedApp.appId).toBe(testState.testConfig.appId);
      expect(permittedApp.version).toBe(testState.testConfig.appVersion);
      expect(permittedApp.pkpSigner).toBe(getPkpSigner());
      expect(permittedApp.pkpSignerPubKey).toBe(testState.pkpSignerPubkey);
      expect(permittedApp.versionEnabled).toBe(true);
      expect(permittedApp.isDeleted).toBe(false);
    });

    it('should get all registered agent addresses for the user', async () => {
      const fetchAllAgents = async () => {
        const PAGE_SIZE = 50;
        let offset = 0;
        let targetAgent: string | undefined;
        let allAgents: string[] = [];

        // Keep querying until we find the PKP or reach the last page
        while (true) {
          const agentAddresses = await testState.userClient.getAllRegisteredAgentAddressesForUser({
            userAddress: testContext.userSigner.address,
            offset: offset.toString(),
          });

          console.log(
            `Page ${Math.floor(offset / PAGE_SIZE) + 1}: Found ${agentAddresses.length} agents (offset: ${offset})`,
          );
          allAgents = [...allAgents, ...agentAddresses];

          // Look for our test agent in this batch
          if (agentAddresses.includes(testState.agentAddress)) {
            targetAgent = testState.agentAddress;
            console.log(
              `Found test agent ${targetAgent} on page ${Math.floor(offset / PAGE_SIZE) + 1}`,
            );
            break;
          }

          // If we got less than PAGE_SIZE results, we've reached the last page
          if (agentAddresses.length < PAGE_SIZE) {
            console.log(`Reached last page. Total agents searched: ${allAgents.length}`);
            break;
          }

          // Move to next page
          offset += PAGE_SIZE;
        }

        return { allAgents, targetAgent };
      };

      const { allAgents, targetAgent } = await waitForValue(
        fetchAllAgents,
        (value) => value.allAgents.includes(testState.agentAddress),
        { label: 'getAllRegisteredAgentAddressesForUser' },
      );

      console.log(`User address: ${testContext.userSigner.address}`);
      console.log(`Looking for agent: ${testState.agentAddress}`);
      console.log(`Total agent addresses found: ${allAgents.length}`);

      expect(allAgents.length).toBeGreaterThan(0);
      expect(targetAgent).toBeDefined();
      expect(allAgents).toContain(testState.agentAddress);
    });

    it('should get all abilities and policies for app', async () => {
      const result = await waitForValue(
        () =>
          testState.userClient.getAllAbilitiesAndPoliciesForApp({
            agentAddress: testState.agentAddress,
            appId: getAppId(),
          }),
        (value) => Object.keys(value).length >= testState.abilityIpfsCids.length,
        { label: 'getAllAbilitiesAndPoliciesForApp' },
      );
      console.log('(should get all abilities and policies for app) result', result);
      expectAssertObject(result);
      // Assert that all expected ability IPFS CIDs are present
      expect(Object.keys(result)).toEqual(expect.arrayContaining(testState.abilityIpfsCids));

      // For each ability, assert that all expected policy IPFS CIDs are present
      for (let i = 0; i < testState.abilityIpfsCids.length; i++) {
        const abilityCid = testState.abilityIpfsCids[i];
        expect(result).toHaveProperty(abilityCid);
        expectAssertObject(result[abilityCid]);
        const actualPolicies = Object.keys(result[abilityCid]);
        const registeredPolicies = new Set(testState.abilityPolicies[i] ?? []);
        actualPolicies.forEach((policyCid) => {
          expect(registeredPolicies.has(policyCid)).toBe(true);
        });

        if (expectedPermissionData) {
          const expectedPolicies = Object.keys(expectedPermissionData[abilityCid] ?? {});
          if (expectedPolicies.length > 0) {
            expect(actualPolicies).toEqual(expect.arrayContaining(expectedPolicies));
          }
        }
      }
    });

    it('should get delegated agent addresses for app version', async () => {
      const result = await waitForValue(
        () =>
          testState.userClient.getDelegatedAgentAddresses({
            appId: getAppId(),
            version: getAppVersion(),
            offset: 0,
          }),
        (value) => value.includes(testState.agentAddress),
        { label: 'getDelegatedAgentAddresses' },
      );
      console.log('(should get delegated agent addresses for app version) result', result);
      expectAssertArray(result);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(testState.agentAddress);
    });

    it('should set ability policy parameters', async () => {
      const abilityIndex = testState.abilityIpfsCids.length > 1 ? 1 : 0;
      const abilityCid = testState.abilityIpfsCids[abilityIndex];
      const policiesForAbility = testState.abilityPolicies[abilityIndex] ?? [];
      const policyCid = policiesForAbility[1] ?? policiesForAbility[0];
      if (!abilityCid || !policyCid) {
        throw new Error('No valid ability/policy pair available to update parameters.');
      }

      const result = await testState.userClient.setAbilityPolicyParameters({
        agentAddress: testState.agentAddress,
        appId: getAppId(),
        appVersion: getAppVersion(),
        policyParams: {
          [abilityCid]: {
            [policyCid]: {
              maxDailySpendingLimitInUsdCents: '10000',
              tokenAddress: '0x4200000000000000000000000000000000000006',
            },
          },
        },
      });
      expect(result).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: result.txHash,
        label: 'setAbilityPolicyParameters',
      });
    });

    it('should unpermit app and verify exclusion from results', async () => {
      // Unpermit the app
      const unpermitResult = await testState.userClient.unPermitApp({
        agentAddress: testState.agentAddress,
        appId: getAppId(),
        appVersion: getAppVersion(),
      });
      expect(unpermitResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: unpermitResult.txHash,
        label: 'unPermitApp',
      });
      // Verify app is excluded from getPermittedAppForAgents
      const result = await waitForValue(
        () =>
          testState.userClient.getPermittedAppForAgents({
            agentAddresses: [testState.agentAddress],
          }),
        (value) => value[0]?.permittedApp === null,
        { label: 'getPermittedAppForAgents after unPermit' },
      );
      console.log('(should unpermit app and verify exclusion from results) result', result);
      expect(result[0].permittedApp).toBeNull();
    });

    it('should get unpermitted apps for agents', async () => {
      const result = await waitForValue(
        () =>
          testState.userClient.getUnpermittedAppForAgents({
            agentAddresses: [testState.agentAddress],
          }),
        (value) => value[0]?.unpermittedApp !== null,
        { label: 'getUnpermittedAppForAgents' },
      );
      expect(result).toHaveLength(1);
      expect(result[0].agentAddress).toBe(testState.agentAddress);
      expect(result[0]).toHaveProperty('unpermittedApp');
      expect(result[0].unpermittedApp).not.toBeNull();

      // Find our test app in the unpermitted apps
      const testApp = result[0].unpermittedApp;
      if (!testApp) {
        throw new Error('Unpermitted app not found');
      }
      expect(testApp.previousPermittedVersion).toBe(testState.testConfig.appVersion);
      expect(testApp.versionEnabled).toBe(true);
      expect(testApp.isDeleted).toBe(false);
    });

    it('should re-permit app using last permitted version', async () => {
      // Re-permit using the new function
      const rePermitResult = await testState.userClient.rePermitApp({
        agentAddress: testState.agentAddress,
        appId: getAppId(),
      });
      expect(rePermitResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: rePermitResult.txHash,
        label: 'rePermitApp',
      });

      // Verify app is permitted again
      const permittedApps = await waitForValue(
        () =>
          testState.userClient.getPermittedAppForAgents({
            agentAddresses: [testState.agentAddress],
          }),
        (value) => value[0]?.permittedApp?.version === testState.testConfig.appVersion,
        { label: 'getPermittedAppForAgents after rePermit' },
      );
      const permittedApp = permittedApps[0].permittedApp;
      expect(permittedApp?.version).toBe(testState.testConfig.appVersion);
    });

    it('should validate delegatee permission using validateAbilityExecutionAndGetPolicies', async () => {
      await testContext.ensureDelegateeForApp(getAppId());
      const validationResult = await waitForValue(
        () =>
          testState.userClient.validateAbilityExecutionAndGetPolicies({
            delegateeAddress: testState.delegateeAddress,
            agentAddress: testState.agentAddress,
            abilityIpfsCid: testState.abilityIpfsCids[0],
          }),
        (value) => value.isPermitted === true,
        { label: 'validateAbilityExecutionAndGetPolicies' },
      );

      expect(validationResult).toBeDefined();
      expect(validationResult.isPermitted).toBe(true);
      expect(validationResult.appId).toBe(getAppId());
      expect(validationResult.appVersion).toBe(getAppVersion());
      expect(validationResult.decodedPolicies).toBeDefined();
    });

    it('should validate delegatee permission using isDelegateePermitted', async () => {
      await testContext.ensureDelegateeForApp(getAppId());
      const isPermitted = await waitForValue(
        () =>
          testState.userClient.isDelegateePermitted({
            delegateeAddress: testState.delegateeAddress,
            agentAddress: testState.agentAddress,
            abilityIpfsCid: testState.abilityIpfsCids[0],
          }),
        (value) => value === true,
        { label: 'isDelegateePermitted' },
      );

      expect(isPermitted).toBe(true);
    });

    it('should return false for non-registered delegatee using isDelegateePermitted', async () => {
      const nonRegisteredDelegatee = ethers.Wallet.createRandom().address;

      await expect(
        testState.userClient.isDelegateePermitted({
          delegateeAddress: nonRegisteredDelegatee,
          agentAddress: testState.agentAddress,
          abilityIpfsCid: testState.abilityIpfsCids[0],
        }),
      ).rejects.toThrow('DelegateeNotAssociatedWithApp');
    });

    it('should return false for invalid ability IPFS CID using isDelegateePermitted', async () => {
      await testContext.ensureDelegateeForApp(getAppId());
      const nonExistentAbility = 'QmInvalidAbilityCid123456789';
      const isPermitted = await testState.userClient.isDelegateePermitted({
        delegateeAddress: testState.delegateeAddress,
        agentAddress: testState.agentAddress,
        abilityIpfsCid: nonExistentAbility,
      });

      expect(isPermitted).toBe(false);
    });
  });

  describe('App Lifecycle', () => {
    it('should enable and disable app versions', async () => {
      // Disable the app version
      const disableResult = await testState.appClient.enableAppVersion({
        appId: getAppId(),
        appVersion: getAppVersion(),
        enabled: false,
      });
      expect(disableResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: disableResult.txHash,
        label: 'disableAppVersion',
      });

      // Verify version is disabled
      const appVersion = await waitForValue(
        () =>
          testState.appClient.getAppVersion({
            appId: getAppId(),
            version: getAppVersion(),
          }),
        (value) => value !== null && value.appVersion.enabled === false,
        { label: 'getAppVersion after disable' },
      );
      if (appVersion === null) {
        throw new Error('App version not found');
      }
      expect(appVersion.appVersion.enabled).toBe(false);

      // Re-enable the app version
      const enableResult = await testState.appClient.enableAppVersion({
        appId: getAppId(),
        appVersion: getAppVersion(),
        enabled: true,
      });
      expect(enableResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: enableResult.txHash,
        label: 'enableAppVersion',
      });

      // Verify version is enabled
      const enabledAppVersion = await waitForValue(
        () =>
          testState.appClient.getAppVersion({
            appId: getAppId(),
            version: getAppVersion(),
          }),
        (value) => value !== null && value.appVersion.enabled === true,
        { label: 'getAppVersion after enable' },
      );
      if (enabledAppVersion === null) {
        throw new Error('App version not found');
      }
      expect(enabledAppVersion.appVersion.enabled).toBe(true);
    });

    it('should register next app version', async () => {
      const nextVersionAbilities = {
        abilityIpfsCids: [generateRandomIpfsCid(), generateRandomIpfsCid()],
        abilityPolicies: [
          [generateRandomIpfsCid()],
          [generateRandomIpfsCid(), generateRandomIpfsCid()],
        ],
      };
      const currentApp = await waitForValue(
        () =>
          testState.appClient.getAppById({
            appId: getAppId(),
          }),
        (value) => value !== null,
        { label: 'getAppById before registerNextVersion' },
      );
      if (currentApp === null) {
        throw new Error('App not found before registerNextVersion');
      }
      const expectedNextVersion = Number(currentApp.latestVersion) + 1;
      const result = await testState.appClient.registerNextVersion({
        appId: getAppId(),
        versionAbilities: nextVersionAbilities,
      });
      expect(result).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: result.txHash,
        label: 'registerNextVersion',
      });
      expect(result.newAppVersion).toBe(expectedNextVersion);
      // Update test config
      testState.testConfig.appVersion = result.newAppVersion;
      saveTestConfig(TEST_CONFIG_PATH, testState.testConfig);

      // Verify next version is registered
      const nextVersion = await waitForValue(
        () =>
          testState.appClient.getAppVersion({
            appId: getAppId(),
            version: getAppVersion(),
          }),
        (value) => value !== null && Number(value.appVersion.version) === expectedNextVersion,
        { label: 'getAppVersion after registerNextVersion' },
      );
      if (nextVersion === null) {
        throw new Error('Next version not found');
      }
      expect(Number(nextVersion.appVersion.version)).toBe(expectedNextVersion);
      expect(nextVersion.appVersion.enabled).toBe(true);
      // The contract returns abilities in a different format than we send
      // Expected: array of {abilityIpfsCid, policyIpfsCids} objects
      expect(Array.isArray(nextVersion.appVersion.abilities)).toBe(true);
      expect(nextVersion.appVersion.abilities).toHaveLength(
        nextVersionAbilities.abilityIpfsCids.length,
      );
      // Verify each ability and its policies are present
      const registeredAbilities = nextVersion.appVersion.abilities as AppAbility[];
      for (let i = 0; i < nextVersionAbilities.abilityIpfsCids.length; i++) {
        const expectedAbility = nextVersionAbilities.abilityIpfsCids[i];
        const expectedPolicies = nextVersionAbilities.abilityPolicies[i];
        const actualAbility = registeredAbilities.find(
          (ability) => ability.abilityIpfsCid === expectedAbility,
        );
        if (!actualAbility) {
          throw new Error(`Ability ${expectedAbility} not found in registered app version`);
        }
        expect(actualAbility.policyIpfsCids).toEqual(expectedPolicies);
      }
    });

    it('should add and remove delegatees', async () => {
      const newDelegatee = ethers.Wallet.createRandom().address;
      // Add delegatee
      const addResult = await testState.appClient.addDelegatee({
        appId: getAppId(),
        delegateeAddress: newDelegatee,
      });
      expect(addResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: addResult.txHash,
        label: 'addDelegatee',
      });

      // Verify delegatee was added
      const appAfterAdd = await waitForValue(
        () =>
          testState.appClient.getAppById({
            appId: getAppId(),
          }),
        (value) => value !== null && value.delegateeAddresses.includes(newDelegatee),
        { label: 'getAppById after addDelegatee' },
      );
      if (appAfterAdd === null) {
        throw new Error('App not found');
      }
      expect(appAfterAdd.delegateeAddresses).toContain(newDelegatee);

      // Remove delegatee
      const removeResult = await testState.appClient.removeDelegatee({
        appId: getAppId(),
        delegateeAddress: newDelegatee,
      });
      expect(removeResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: removeResult.txHash,
        label: 'removeDelegatee',
      });

      // Verify delegatee was removed
      const appAfterRemove = await waitForValue(
        () =>
          testState.appClient.getAppById({
            appId: getAppId(),
          }),
        (value) => value !== null && !value.delegateeAddresses.includes(newDelegatee),
        { label: 'getAppById after removeDelegatee' },
      );
      if (appAfterRemove === null) {
        throw new Error('App not found');
      }
      expect(appAfterRemove.delegateeAddresses).not.toContain(newDelegatee);
    });

    it('should delete and undelete app', async () => {
      // Delete app
      const deleteResult = await testState.appClient.deleteApp({
        appId: getAppId(),
      });
      expect(deleteResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: deleteResult.txHash,
        label: 'deleteApp',
      });

      // Verify app is deleted
      const deletedApp = await waitForValue(
        () =>
          testState.appClient.getAppById({
            appId: getAppId(),
          }),
        (value) => value !== null && value.isDeleted === true,
        { label: 'getAppById after delete' },
      );
      if (deletedApp === null) {
        throw new Error('App not found');
      }
      expect(deletedApp.isDeleted).toBe(true);

      // Undelete app
      const undeleteResult = await testState.appClient.undeleteApp({
        appId: getAppId(),
      });
      expect(undeleteResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: undeleteResult.txHash,
        label: 'undeleteApp',
      });

      // Verify app is undeleted
      const undeletedApp = await waitForValue(
        () =>
          testState.appClient.getAppById({
            appId: getAppId(),
          }),
        (value) => value !== null && value.isDeleted === false,
        { label: 'getAppById after undelete' },
      );
      if (undeletedApp === null) {
        throw new Error('App not found');
      }
      expect(undeletedApp.isDeleted).toBe(false);
    });

    it('should set delegatees (replace all)', async () => {
      const newDelegatees = [
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
      ];
      const setResult = await testState.appClient.setDelegatee({
        appId: getAppId(),
        delegateeAddresses: newDelegatees,
      });
      expect(setResult).toHaveProperty('txHash');
      await logTxEvents({
        provider: testState.provider,
        txHash: setResult.txHash,
        label: 'setDelegatee',
      });

      // Verify delegatees were set
      const appAfterSet = await waitForValue(
        () =>
          testState.appClient.getAppById({
            appId: getAppId(),
          }),
        (value) =>
          value !== null &&
          newDelegatees.every((delegatee) => value.delegateeAddresses.includes(delegatee)),
        { label: 'getAppById after setDelegatee' },
      );
      if (appAfterSet === null) {
        throw new Error('App not found');
      }
      expect(appAfterSet.delegateeAddresses).toEqual(newDelegatees);

      // Restore original delegatee for cleanup
      await testState.appClient.setDelegatee({
        appId: getAppId(),
        delegateeAddresses: [testState.delegateeAddress],
      });
    });
  });
});
