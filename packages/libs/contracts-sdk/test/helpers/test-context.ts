import { ethers } from 'ethers';
import type { providers } from 'ethers';

import { getTestClient } from '../../src';
import type { PermissionData } from '../../src/types';
import type { TestConfig } from './test-config';

import { checkShouldMintAndFundPkp } from './check-mint-fund-pkp';
import { checkShouldMintCapacityCredit } from './check-mint-capcity-credit';
import { createAccountManager } from './account-manager';
import { resolveAgentSmartAccountAddress } from './resolve-agent-smart-account';
import { getTestConfig, saveTestConfig } from './test-config';
import { logTxEvents, requireValue, waitForValue } from './test-utils';

type TestClient = ReturnType<typeof getTestClient>;

export type TestContextState = {
  testConfig: TestConfig;
  appClient: TestClient; // App manager client for app lifecycle calls (register/version/delegatees).
  userClient: TestClient; // User client for PKP/agent permission calls (permit/unpermit/policy params).
  provider: providers.JsonRpcProvider;
  delegateeAddress: string | `0x${string}`;
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  agentAddress: string;
  pkpSignerPubkey: string;
};

type TestContextOptions = {
  state: TestContextState;
  testConfigPath: string;
};

type CreateTestContextOptions = TestContextOptions & {
  shouldResetPkp: boolean;
  baseSepoliaRpcUrl: string;
  appManagerPrivateKey: string;
  userPrivateKey: string;
  funderPrivateKey?: string;
  delegateeAddress: string;
};

export const createTestContext = async ({
  state,
  testConfigPath,
  shouldResetPkp,
  baseSepoliaRpcUrl,
  appManagerPrivateKey,
  userPrivateKey,
  funderPrivateKey,
  delegateeAddress,
}: CreateTestContextOptions) => {
  // Initialize config + provider so that the test setup is centralized and repeatable.
  state.testConfig = getTestConfig(testConfigPath);
  if (shouldResetPkp) {
    state.testConfig.userPkp = {
      tokenId: null,
      ethAddress: null,
      pkpPubkey: null,
    };
    state.testConfig.agentSmartAccountAddress = null;
  }

  state.testConfig = await checkShouldMintAndFundPkp(state.testConfig);
  state.testConfig = await checkShouldMintCapacityCredit(state.testConfig);
  await resolveAgentSmartAccountAddress(state.testConfig);

  const userPkp = requireValue(state.testConfig.userPkp, 'testConfig.userPkp');
  state.agentAddress = requireValue(
    state.testConfig.agentSmartAccountAddress,
    'testConfig.agentSmartAccountAddress',
  );
  state.pkpSignerPubkey = requireValue(userPkp.pkpPubkey, 'testConfig.userPkp.pkpPubkey');
  state.provider = new ethers.providers.JsonRpcProvider(baseSepoliaRpcUrl);

  const { appManagerSigner, userSigner, funderSigner } = createAccountManager({
    provider: state.provider,
    appManagerPrivateKey,
    userPrivateKey,
    funderPrivateKey,
  });

  // Wire up clients + delegatee so that specs can focus on test intent.
  state.appClient = getTestClient({ signer: appManagerSigner });
  state.userClient = getTestClient({ signer: userSigner });
  state.delegateeAddress = delegateeAddress;
  // Build permission payloads from abilities/policies so that permit flows reuse the same shape in tests.
  const buildPermissionData = (): PermissionData => {
    const permissionData: PermissionData = {};

    state.abilityIpfsCids.forEach((abilityCid, idx) => {
      const policies = state.abilityPolicies[idx] ?? [];
      const policyParams: Record<
        string,
        { maxDailySpendingLimitInUsdCents: string; tokenAddress: string }
      > = {};

      if (policies.length > 0) {
        policyParams[policies[0]] = {
          maxDailySpendingLimitInUsdCents: '10000',
          tokenAddress: '0x4200000000000000000000000000000000000006',
        };
      }

      permissionData[abilityCid] = policyParams;
    });

    return permissionData;
  };

  // Reset and re-mint the PKP in config so that tests can recover from stale/registered signers.
  const refreshTestPkp = async () => {
    const previousConfig = state.testConfig;
    const previousPkp = previousConfig.userPkp
      ? { ...previousConfig.userPkp }
      : { tokenId: null, ethAddress: null, pkpPubkey: null };
    const previousAgentSmartAccountAddress = previousConfig.agentSmartAccountAddress ?? null;
    previousConfig.userPkp = {
      tokenId: null,
      ethAddress: null,
      pkpPubkey: null,
    };
    previousConfig.agentSmartAccountAddress = null;
    state.testConfig = previousConfig;
    try {
      const updatedConfig = await checkShouldMintAndFundPkp(previousConfig);
      await resolveAgentSmartAccountAddress(updatedConfig);
      state.testConfig = updatedConfig;
    } catch (error) {
      previousConfig.userPkp = previousPkp;
      previousConfig.agentSmartAccountAddress = previousAgentSmartAccountAddress;
      state.testConfig = previousConfig;
      throw error;
    }
    const updatedUserPkp = requireValue(state.testConfig.userPkp, 'testConfig.userPkp');
    state.agentAddress = requireValue(
      state.testConfig.agentSmartAccountAddress,
      'testConfig.agentSmartAccountAddress',
    );
    state.pkpSignerPubkey = requireValue(updatedUserPkp.pkpPubkey, 'testConfig.userPkp.pkpPubkey');
  };

  // Load ability/policy CIDs from an existing on-chain app version so that assertions match current state.
  const loadExistingAppState = async ({
    appId,
    appVersion,
  }: {
    appId: number;
    appVersion: number;
  }) => {
    const existingVersion = await state.appClient.getAppVersion({
      appId,
      version: appVersion,
    });

    if (!existingVersion) {
      throw new Error(`App version ${appVersion} not found for app ${appId}`);
    }

    state.abilityIpfsCids = existingVersion.appVersion.abilities.map(
      (ability) => ability.abilityIpfsCid,
    );
    state.abilityPolicies = existingVersion.appVersion.abilities.map(
      (ability) => ability.policyIpfsCids,
    );
  };

  // Sync the persisted app/version to an on-chain version so that reruns follow the active state.
  const syncTestConfigForVersion = async ({
    appId,
    appVersion,
    reason,
  }: {
    appId: number;
    appVersion: number;
    reason?: string;
  }) => {
    const currentConfig = state.testConfig;
    const needsUpdate = currentConfig.appId !== appId || currentConfig.appVersion !== appVersion;
    if (needsUpdate) {
      currentConfig.appId = appId;
      currentConfig.appVersion = appVersion;
      state.testConfig = currentConfig;
      saveTestConfig(testConfigPath, currentConfig);
      if (reason) {
        console.log(`ℹ️  Synced test config to app ${appId} version ${appVersion} (${reason})`);
      }
    }

    await loadExistingAppState({ appId, appVersion });
  };

  // Read the permitted app and optionally sync config so that later steps use the permitted version.
  const readPermittedApp = async ({
    requirePermitted = false,
    label = 'getPermittedAppForAgents',
  }: {
    requirePermitted?: boolean;
    label?: string;
  } = {}) => {
    const result = await waitForValue(
      () =>
        state.userClient.getPermittedAppForAgents({
          agentAddresses: [state.agentAddress],
        }),
      (value) => (requirePermitted ? value[0]?.permittedApp !== null : true),
      { label },
    );

    const permittedApp = result[0]?.permittedApp ?? null;
    if (permittedApp) {
      await syncTestConfigForVersion({
        appId: permittedApp.appId,
        appVersion: permittedApp.version,
        reason: label,
      });
    }
    return permittedApp;
  };

  // Ensure the delegatee belongs to the target app so that permission validation aligns with registry state.
  const ensureDelegateeForApp = async (appId: number) => {
    const currentDelegateeApp = await waitForValue(
      () =>
        state.appClient.getAppByDelegateeAddress({
          delegateeAddress: state.delegateeAddress,
        }),
      (value) => value === null || value !== undefined,
      { label: 'getAppByDelegateeAddress for ensureDelegateeForApp' },
    );

    if (currentDelegateeApp && Number(currentDelegateeApp.id) === appId) {
      return;
    }

    if (currentDelegateeApp) {
      const removeResult = await state.appClient.removeDelegatee({
        appId: Number(currentDelegateeApp.id),
        delegateeAddress: state.delegateeAddress,
      });
      await logTxEvents({
        provider: state.provider,
        txHash: removeResult.txHash,
        label: 'removeDelegatee (reassign delegatee)',
      });
      await waitForValue(
        () =>
          state.appClient.getAppByDelegateeAddress({
            delegateeAddress: state.delegateeAddress,
          }),
        (value) => value === null,
        { label: 'wait for delegatee removal' },
      );
    }

    const targetApp = await waitForValue(
      () =>
        state.appClient.getAppById({
          appId,
        }),
      (value) => value !== null,
      { label: 'getAppById for ensureDelegateeForApp' },
    );

    if (targetApp && !targetApp.delegateeAddresses.includes(state.delegateeAddress)) {
      try {
        const addResult = await state.appClient.addDelegatee({
          appId,
          delegateeAddress: state.delegateeAddress,
        });
        await logTxEvents({
          provider: state.provider,
          txHash: addResult.txHash,
          label: 'addDelegatee (reassign delegatee)',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('DelegateeAlreadyRegisteredToApp')) {
          console.log(
            'ℹ️  Delegatee already registered; waiting for app state to reflect delegatee assignment.',
          );
        } else {
          throw error;
        }
      }
    }

    await waitForValue(
      () =>
        state.appClient.getAppById({
          appId,
        }),
      (value) => value !== null && value.delegateeAddresses.includes(state.delegateeAddress),
      { label: 'getAppById after ensureDelegateeForApp' },
    );
  };

  return {
    appManagerSigner,
    userSigner,
    funderSigner,
    buildPermissionData,
    refreshTestPkp,
    loadExistingAppState,
    syncTestConfigForVersion,
    readPermittedApp,
    ensureDelegateeForApp,
  };
};
