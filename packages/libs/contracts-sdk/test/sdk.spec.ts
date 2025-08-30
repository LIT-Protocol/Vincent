import { ethers } from 'ethers';

import type { PermissionData } from '../src/types';
import type { TestConfig } from './helpers';

import { getTestClient } from '../src/index';
import { expectAssertArray, expectAssertObject } from './assertions';
import {
  getTestConfig,
  saveTestConfig,
  YELLOWSTONE_RPC_URL,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  TEST_APP_DELEGATEE_SIGNER,
  TEST_CONFIG_PATH,
  checkShouldMintAndFundPkp,
  checkShouldMintCapacityCredit,
} from './helpers';
import {
  generateRandomAppId,
  generateRandomIpfsCid,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';

// Extend Jest timeout to 2 minutes
jest.setTimeout(120000);

describe('Vincent Contracts SDK E2E', () => {
  let APP_MANAGER_SIGNER: ethers.Wallet;
  let USER_SIGNER: ethers.Wallet;
  let TEST_CONFIG: TestConfig;
  let APP_CLIENT: ReturnType<typeof getTestClient>;
  let USER_CLIENT: ReturnType<typeof getTestClient>;
  let DELEGATEE_ADDRESS: string;
  let ABILITY_IPFS_CIDS: string[];
  let ABILITY_POLICIES: string[][];
  let APP_ID: number;

  beforeAll(async () => {
    // Load or initialize test configuration
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // Create provider and signers
    const provider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
    APP_MANAGER_SIGNER = new ethers.Wallet(TEST_APP_MANAGER_PRIVATE_KEY, provider);
    USER_SIGNER = new ethers.Wallet(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY, provider);

    // Initialize clients
    APP_CLIENT = getTestClient({ signer: APP_MANAGER_SIGNER });
    USER_CLIENT = getTestClient({ signer: USER_SIGNER });
    // Use the delegatee from abilities-e2e pattern
    DELEGATEE_ADDRESS = TEST_APP_DELEGATEE_SIGNER.address;

    // Clean up any existing delegatee registration
    await removeAppDelegateeIfNeeded();

    ABILITY_IPFS_CIDS = [generateRandomIpfsCid(), generateRandomIpfsCid()];
    ABILITY_POLICIES = [
      [generateRandomIpfsCid()], // Policy for first ability
      [generateRandomIpfsCid(), generateRandomIpfsCid()], // Policies for second ability
    ];
    APP_ID = generateRandomAppId();
  });

  afterAll(async () => {
    // Clean up: remove the delegatee if needed
    await removeAppDelegateeIfNeeded();
    console.log('✅ Test cleanup completed');
  });

  describe('App Management', () => {
    it('should register a new Vincent app with abilities and policies', async () => {
      const { txHash } = await APP_CLIENT.registerApp({
        appId: APP_ID,
        delegateeAddresses: [DELEGATEE_ADDRESS],
        versionAbilities: {
          abilityIpfsCids: ABILITY_IPFS_CIDS,
          abilityPolicies: ABILITY_POLICIES,
        },
      });
      expect(txHash).toBeTruthy();
      // Update test config
      TEST_CONFIG.appId = APP_ID;
      TEST_CONFIG.appVersion = 1;
      saveTestConfig(TEST_CONFIG_PATH, TEST_CONFIG);
      console.log(`✅ Registered new App with ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
    });

    it('should retrieve app details by ID', async () => {
      const app = await APP_CLIENT.getAppById({
        appId: TEST_CONFIG.appId!,
      });
      if (app === null) {
        throw new Error('App not found');
      }
      expect(app).toBeTruthy();
      expect(app.id).toBe(TEST_CONFIG.appId);
      expect(app.isDeleted).toBe(false);
      expect(app.latestVersion).toBe(1);
      expect(app.delegateeAddresses).toContain(DELEGATEE_ADDRESS);
    });

    it('should retrieve app by delegatee address', async () => {
      const app = await APP_CLIENT.getAppByDelegateeAddress({
        delegateeAddress: DELEGATEE_ADDRESS,
      });
      if (app === null) {
        throw new Error('App not found');
      }
      expect(app).toBeTruthy();
      expect(app.id).toBe(TEST_CONFIG.appId);
      expect(app.isDeleted).toBe(false);
      expect(app.manager).toBe(APP_MANAGER_SIGNER.address);
      expect(app.latestVersion).toBe(1);
      expect(app.delegateeAddresses).toContain(DELEGATEE_ADDRESS);
    });

    it('should get app ID by delegatee', async () => {
      const appId = await APP_CLIENT.getAppIdByDelegatee({
        delegateeAddress: DELEGATEE_ADDRESS,
      });
      expect(appId).toBe(TEST_CONFIG.appId);
    });

    it('should return null for non-registered delegatee', async () => {
      const nonRegisteredDelegatee = ethers.Wallet.createRandom().address;
      const result = await APP_CLIENT.getAppIdByDelegatee({
        delegateeAddress: nonRegisteredDelegatee,
      });
      expect(result).toBe(null);
    });

    it('should get all apps by manager', async () => {
      const result = await APP_CLIENT.getAppsByManagerAddress({
        managerAddress: APP_MANAGER_SIGNER.address,
        offset: '0',
      });
      expect(result.length).toBeGreaterThan(0);
      const testApp = result.find((app) => app.id === TEST_CONFIG.appId);
      expect(testApp).toBeDefined();
    });
  });

  describe('PKP Permissions', () => {
    it('should permit app version for PKP', async () => {
      // Create permission data with policy parameters
      const permissionData: PermissionData = {
        [ABILITY_IPFS_CIDS[0]]: {
          [ABILITY_POLICIES[0][0]]: {
            maxDailySpendingLimitInUsdCents: '10000',
            tokenAddress: '0x4200000000000000000000000000000000000006',
          },
        },
        [ABILITY_IPFS_CIDS[1]]: {
          [ABILITY_POLICIES[1][0]]: {
            maxDailySpendingLimitInUsdCents: '10000',
            tokenAddress: '0x4200000000000000000000000000000000000006',
          },
          [ABILITY_POLICIES[1][1]]: {
            maxDailySpendingLimitInUsdCents: '10000',
            tokenAddress: '0x4200000000000000000000000000000000000006',
          },
        },
      };
      const result = await USER_CLIENT.permitApp({
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        appId: TEST_CONFIG.appId!,
        appVersion: TEST_CONFIG.appVersion!,
        permissionData,
      });
      expect(result).toHaveProperty('txHash');
      console.log(
        `✅ Permitted App ID ${TEST_CONFIG.appId} version ${TEST_CONFIG.appVersion} for PKP ${TEST_CONFIG.userPkp!.ethAddress}\nTx hash: ${result.txHash}`,
      );
      // Verify app is permitted
      const permittedVersion = await USER_CLIENT.getPermittedAppVersionForPkp({
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        appId: TEST_CONFIG.appId!,
      });
      expect(permittedVersion).toBe(TEST_CONFIG.appVersion);
    });

    it('should getAllPermittedAppIdsForPkp', async () => {
      const allPermittedAppIds = await USER_CLIENT.getAllPermittedAppIdsForPkp({
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        offset: '0',
      });
      expect(allPermittedAppIds).toContain(TEST_CONFIG.appId);
    });

    it('should get permitted apps using the getPermittedAppsForPkps method', async () => {
      const result = await USER_CLIENT.getPermittedAppsForPkps({
        pkpEthAddresses: [TEST_CONFIG.userPkp!.ethAddress!],
        offset: '0',
        pageSize: '10',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('pkpTokenId');
      expect(result[0].pkpTokenId).toBe(TEST_CONFIG.userPkp!.tokenId);

      expect(result[0]).toHaveProperty('permittedApps');
      expect(result[0].permittedApps).toHaveLength(1);
      expect(result[0].permittedApps[0].appId).toBe(TEST_CONFIG.appId);
      expect(result[0].permittedApps[0].version).toBe(TEST_CONFIG.appVersion);
      expect(result[0].permittedApps[0].versionEnabled).toBe(true);
    });

    it('should get all registered agent PKPs', async () => {
      const agentPkps = await USER_CLIENT.getAllRegisteredAgentPkpEthAddresses({
        userPkpAddress: USER_SIGNER.address, // Using PKP address as user PKP
        offset: '0',
      });
      expect(agentPkps.length).toBeGreaterThan(0);
      expect(agentPkps).toContain(TEST_CONFIG.userPkp!.ethAddress!);
    });

    it('should get all abilities and policies for app', async () => {
      const result = await USER_CLIENT.getAllAbilitiesAndPoliciesForApp({
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        appId: TEST_CONFIG.appId!,
      });
      console.log('(should get all abilities and policies for app) result', result);
      expectAssertObject(result);
      // Assert that all expected ability IPFS CIDs are present
      expect(Object.keys(result)).toEqual(expect.arrayContaining(ABILITY_IPFS_CIDS));
      // For each ability, assert that all expected policy IPFS CIDs are present
      for (let i = 0; i < ABILITY_IPFS_CIDS.length; i++) {
        const abilityCid = ABILITY_IPFS_CIDS[i];
        expect(result).toHaveProperty(abilityCid);
        expectAssertObject(result[abilityCid]);
        expect(Object.keys(result[abilityCid])).toEqual(
          expect.arrayContaining(ABILITY_POLICIES[i]),
        );
      }
    });

    it('should get delegated PKP addresses for app version', async () => {
      const result = await USER_CLIENT.getDelegatedPkpEthAddresses({
        appId: TEST_CONFIG.appId!,
        version: TEST_CONFIG.appVersion!,
        offset: 0,
      });
      expectAssertArray(result);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(TEST_CONFIG.userPkp!.ethAddress!);
    });

    it('should set ability policy parameters', async () => {
      const result = await USER_CLIENT.setAbilityPolicyParameters({
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        appId: TEST_CONFIG.appId!,
        appVersion: TEST_CONFIG.appVersion!,
        policyParams: {
          [ABILITY_IPFS_CIDS[0]]: {
            [ABILITY_POLICIES[0][0]]: {
              maxDailySpendingLimitInUsdCents: '15000',
              tokenAddress: '0x4200000000000000000000000000000000000006',
            },
          },
        },
      });
      expect(result).toHaveProperty('txHash');
    });

    it('should unpermit app and verify exclusion from results', async () => {
      // Unpermit the app
      const unpermitResult = await USER_CLIENT.unPermitApp({
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        appId: TEST_CONFIG.appId!,
        appVersion: TEST_CONFIG.appVersion!,
      });
      expect(unpermitResult).toHaveProperty('txHash');
      // Verify app is excluded from getPermittedAppsForPkps
      const result = await USER_CLIENT.getPermittedAppsForPkps({
        pkpEthAddresses: [TEST_CONFIG.userPkp!.ethAddress!],
        offset: '0',
        pageSize: '10',
      });
      expect(result).toHaveLength(1);
      // Should not find our test app in the results
      const testApp = result[0].permittedApps.find((app) => app.appId === TEST_CONFIG.appId);
      expect(testApp).toBeUndefined();
    });
  });

  describe('App Lifecycle', () => {
    it('should enable and disable app versions', async () => {
      // Disable the app version
      const disableResult = await APP_CLIENT.enableAppVersion({
        appId: TEST_CONFIG.appId!,
        appVersion: TEST_CONFIG.appVersion!,
        enabled: false,
      });
      expect(disableResult).toHaveProperty('txHash');

      // Verify version is disabled
      const appVersion = await APP_CLIENT.getAppVersion({
        appId: TEST_CONFIG.appId!,
        version: TEST_CONFIG.appVersion!,
      });
      if (appVersion === null) {
        throw new Error('App version not found');
      }
      expect(appVersion.appVersion.enabled).toBe(false);

      // Re-enable the app version
      const enableResult = await APP_CLIENT.enableAppVersion({
        appId: TEST_CONFIG.appId!,
        appVersion: TEST_CONFIG.appVersion!,
        enabled: true,
      });
      expect(enableResult).toHaveProperty('txHash');

      // Verify version is enabled
      const enabledAppVersion = await APP_CLIENT.getAppVersion({
        appId: TEST_CONFIG.appId!,
        version: TEST_CONFIG.appVersion!,
      });
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
      const result = await APP_CLIENT.registerNextVersion({
        appId: TEST_CONFIG.appId!,
        versionAbilities: nextVersionAbilities,
      });
      expect(result).toHaveProperty('txHash');
      expect(result.newAppVersion).toBe(2);
      // Update test config
      TEST_CONFIG.appVersion = result.newAppVersion;
      saveTestConfig(TEST_CONFIG_PATH, TEST_CONFIG);

      // Verify next version is registered
      const nextVersion = await APP_CLIENT.getAppVersion({
        appId: TEST_CONFIG.appId!,
        version: TEST_CONFIG.appVersion!,
      });
      if (nextVersion === null) {
        throw new Error('Next version not found');
      }
      expect(nextVersion.appVersion.version).toBe(2);
      expect(nextVersion.appVersion.enabled).toBe(true);
      // The contract returns abilities in a different format than we send
      // Expected: array of {abilityIpfsCid, policyIpfsCids} objects
      expect(Array.isArray(nextVersion.appVersion.abilities)).toBe(true);
      expect(nextVersion.appVersion.abilities).toHaveLength(
        nextVersionAbilities.abilityIpfsCids.length,
      );
      // Verify each ability and its policies are present
      for (let i = 0; i < nextVersionAbilities.abilityIpfsCids.length; i++) {
        const expectedAbility = nextVersionAbilities.abilityIpfsCids[i];
        const expectedPolicies = nextVersionAbilities.abilityPolicies[i];
        const actualAbility = nextVersion.appVersion.abilities.find(
          (ability: any) => ability.abilityIpfsCid === expectedAbility,
        );
        expect(actualAbility).toBeDefined();
        expect(actualAbility!.policyIpfsCids).toEqual(expectedPolicies);
      }
    });

    it('should add and remove delegatees', async () => {
      const newDelegatee = ethers.Wallet.createRandom().address;
      // Add delegatee
      const addResult = await APP_CLIENT.addDelegatee({
        appId: TEST_CONFIG.appId!,
        delegateeAddress: newDelegatee,
      });
      expect(addResult).toHaveProperty('txHash');

      // Verify delegatee was added
      const appAfterAdd = await APP_CLIENT.getAppById({
        appId: TEST_CONFIG.appId!,
      });
      if (appAfterAdd === null) {
        throw new Error('App not found');
      }
      expect(appAfterAdd.delegateeAddresses).toContain(newDelegatee);

      // Remove delegatee
      const removeResult = await APP_CLIENT.removeDelegatee({
        appId: TEST_CONFIG.appId!,
        delegateeAddress: newDelegatee,
      });
      expect(removeResult).toHaveProperty('txHash');

      // Verify delegatee was removed
      const appAfterRemove = await APP_CLIENT.getAppById({
        appId: TEST_CONFIG.appId!,
      });
      if (appAfterRemove === null) {
        throw new Error('App not found');
      }
      expect(appAfterRemove.delegateeAddresses).not.toContain(newDelegatee);
    });

    it('should delete and undelete app', async () => {
      // Delete app
      const deleteResult = await APP_CLIENT.deleteApp({
        appId: TEST_CONFIG.appId!,
      });
      expect(deleteResult).toHaveProperty('txHash');

      // Verify app is deleted
      const deletedApp = await APP_CLIENT.getAppById({
        appId: TEST_CONFIG.appId!,
      });
      if (deletedApp === null) {
        throw new Error('App not found');
      }
      expect(deletedApp.isDeleted).toBe(true);

      // Undelete app
      const undeleteResult = await APP_CLIENT.undeleteApp({
        appId: TEST_CONFIG.appId!,
      });
      expect(undeleteResult).toHaveProperty('txHash');

      // Verify app is undeleted
      const undeletedApp = await APP_CLIENT.getAppById({
        appId: TEST_CONFIG.appId!,
      });
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
      const setResult = await APP_CLIENT.setDelegatee({
        appId: TEST_CONFIG.appId!,
        delegateeAddresses: newDelegatees,
      });
      expect(setResult).toHaveProperty('txHash');

      // Verify delegatees were set
      const appAfterSet = await APP_CLIENT.getAppById({
        appId: TEST_CONFIG.appId!,
      });
      if (appAfterSet === null) {
        throw new Error('App not found');
      }
      expect(appAfterSet.delegateeAddresses).toEqual(newDelegatees);

      // Restore original delegatee for cleanup
      await APP_CLIENT.setDelegatee({
        appId: TEST_CONFIG.appId!,
        delegateeAddresses: [DELEGATEE_ADDRESS],
      });
    });
  });
});
