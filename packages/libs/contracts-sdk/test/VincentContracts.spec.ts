import { config } from '@dotenvx/dotenvx';
import { ethers, providers } from 'ethers';

import {
  LitActionResource,
  LitPKPResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

import type { AppVersionAbilities } from '../src/index';

import {
  registerApp,
  registerNextVersion,
  permitApp,
  enableAppVersion,
  addDelegatee,
  removeDelegatee,
  deleteApp,
  undeleteApp,
  getAppById,
  getAppVersion,
  getAppsByManagerAddress,
  getAppByDelegateeAddress,
  getDelegatedPkpEthAddresses,
  getAllRegisteredAgentPkpEthAddresses,
  getPermittedAppVersionForPkp,
  getAllPermittedAppIdsForPkp,
  getAllAbilitiesAndPoliciesForApp,
  setAbilityPolicyParameters,
  unPermitApp,
  getAppIdByDelegatee,
} from '../src/index';
import { expectAssertArray, expectAssertObject } from './assertions';

const generateRandomIpfsCid = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return (
    'Qm' +
    Array.from({ length: 42 }, (): string => chars[Math.floor(Math.random() * chars.length)]).join(
      '',
    )
  );
};

config();
if (!process.env.TEST_APP_MANAGER_PRIVATE_KEY) {
  console.error('TEST_APP_MANAGER_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_USER_AUTH_SIG_PRIVATE_KEY) {
  console.error('TEST_USER_AUTH_SIG_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_USER_PKP_PUBKEY) {
  console.error('TEST_USER_PKP_PUBKEY environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_USER_PKP_ADDRESS) {
  console.error('TEST_USER_PKP_ADDRESS environment variable is required');
  process.exit(1);
}

describe('VincentContracts', () => {
  it('should perform all actions on a new App and User Agent', async () => {
    const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');

    // App Contracts Client
    const appManagerSigner = new ethers.Wallet(process.env.TEST_APP_MANAGER_PRIVATE_KEY!, provider);

    const appId = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toNumber();
    const delegatees = [ethers.Wallet.createRandom().address];

    // Register initial app version
    const initialVersionAbilities: AppVersionAbilities = {
      abilityIpfsCids: [generateRandomIpfsCid()],
      abilityPolicies: [[]],
    };
    const initialAppVersion = await registerApp({
      signer: appManagerSigner,
      args: {
        appId,
        delegateeAddresses: delegatees,
        versionAbilities: initialVersionAbilities,
      },
      overrides: {
        gasLimit: 10000000,
      },
    });
    console.log('App registration result:', initialAppVersion);
    expect(initialAppVersion).toHaveProperty('txHash');

    // Get the app by ID
    const appByIdResult = await getAppById({
      signer: appManagerSigner,
      args: {
        appId,
      },
    });
    console.log('App by ID result:', appByIdResult);

    expectAssertObject(appByIdResult);

    expect(appByIdResult.id).toBe(appId);
    expect(appByIdResult.isDeleted).toBe(false);
    expect(appByIdResult.manager).toBe(appManagerSigner.address);
    expect(appByIdResult.latestVersion).toBe(1);
    expect(appByIdResult.delegateeAddresses).toEqual(delegatees);

    // Disable the initial app version
    const disableAppVersionResult = await enableAppVersion({
      signer: appManagerSigner,
      args: {
        appId,
        appVersion: 1,
        enabled: false,
      },
    });
    console.log('Disable app version result:', disableAppVersionResult);
    expect(disableAppVersionResult).toHaveProperty('txHash');

    // Get app version
    const appVersionResult = await getAppVersion({
      signer: appManagerSigner,
      args: {
        appId,
        version: 1,
      },
    });
    console.log('App version result:', appVersionResult);

    expectAssertObject(appVersionResult);
    expect(appVersionResult.appVersion.version).toBe(1);
    expect(appVersionResult.appVersion.enabled).toBe(false);

    // Get all apps by manager
    const appsByManagerResult = await getAppsByManagerAddress({
      signer: appManagerSigner,
      args: {
        managerAddress: appManagerSigner.address,
        offset: '0',
      },
    });
    console.log('Apps by manager result:', appsByManagerResult);
    expect(appsByManagerResult.length).toBeGreaterThan(0);

    // Get app by delegatee
    const appByDelegateeResult = await getAppByDelegateeAddress({
      signer: appManagerSigner,
      args: {
        delegateeAddress: delegatees[0],
      },
    });
    console.log('App by delegatee result:', appByDelegateeResult);
    expectAssertObject(appByDelegateeResult);
    expect(appByDelegateeResult.id).toBe(appId);
    expect(appByDelegateeResult.isDeleted).toBe(false);
    expect(appByDelegateeResult.manager).toBe(appManagerSigner.address);
    expect(appByDelegateeResult.latestVersion).toBe(1);
    expect(appByDelegateeResult.delegateeAddresses).toEqual(delegatees);

    // Get app ID by delegatee
    const appIdByDelegateeResult = await getAppIdByDelegatee({
      signer: appManagerSigner,
      args: {
        delegatee: delegatees[0],
      },
    });
    console.log('App ID by delegatee result:', appIdByDelegateeResult);
    expect(appIdByDelegateeResult).toBe(appId.toString());

    // Test getAppIdByDelegatee with non-registered delegatee
    const nonRegisteredDelegatee = ethers.Wallet.createRandom().address;
    const nonRegisteredAppIdResult = await getAppIdByDelegatee({
      signer: appManagerSigner,
      args: {
        delegatee: nonRegisteredDelegatee,
      },
    });
    console.log('Non-registered delegatee app ID result:', nonRegisteredAppIdResult);
    expect(nonRegisteredAppIdResult).toBe(null);

    // Register next app version
    const nextVersionAbilities: AppVersionAbilities = {
      abilityIpfsCids: [initialVersionAbilities.abilityIpfsCids[0], generateRandomIpfsCid()], // one existing & one new ability
      abilityPolicies: [
        [generateRandomIpfsCid()], // new policy for the existing ability
        [generateRandomIpfsCid(), generateRandomIpfsCid()], // new policy for the new ability
      ],
    };
    const nextAppVersion = await registerNextVersion({
      signer: appManagerSigner,
      args: {
        appId,
        versionAbilities: nextVersionAbilities,
      },
    });
    console.log('Next version registration result:', nextAppVersion);
    expect(nextAppVersion).toHaveProperty('txHash');
    expect(nextAppVersion.newAppVersion).toBe(2);

    // Add a delegatee
    const addDelegateeResult = await addDelegatee({
      signer: appManagerSigner,
      args: {
        appId,
        delegateeAddress: ethers.Wallet.createRandom().address,
      },
    });
    console.log('Add delegatee result:', addDelegateeResult);
    expect(addDelegateeResult).toHaveProperty('txHash');

    // Remove the delegatee
    const removeDelegateeResult = await removeDelegatee({
      signer: appManagerSigner,
      args: {
        appId,
        delegateeAddress: delegatees[0],
      },
    });
    console.log('Remove delegatee result:', removeDelegateeResult);
    expect(removeDelegateeResult).toHaveProperty('txHash');

    // Delete the app
    const deleteAppResult = await deleteApp({
      signer: appManagerSigner,
      args: {
        appId,
      },
    });
    console.log('Delete app result:', deleteAppResult);
    expect(deleteAppResult).toHaveProperty('txHash');

    // Undelete the app
    const undeleteAppResult = await undeleteApp({
      signer: appManagerSigner,
      args: {
        appId,
      },
    });
    console.log('Undelete app result:', undeleteAppResult);
    expect(undeleteAppResult).toHaveProperty('txHash');

    // User Client
    const userSigner = new ethers.Wallet(process.env.TEST_USER_AUTH_SIG_PRIVATE_KEY!, provider);
    const litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: false,
    });
    await litNodeClient.connect();

    const controllerSessionSigs = await litNodeClient.getSessionSigs({
      chain: 'ethereum',
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      capabilityAuthSigs: [],
      resourceAbilityRequests: [
        {
          resource: new LitPKPResource('*'),
          ability: LIT_ABILITY.PKPSigning,
        },
        {
          resource: new LitActionResource('*'),
          ability: LIT_ABILITY.LitActionExecution,
        },
      ],
      authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
        const toSign = await createSiweMessage({
          uri,
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: userSigner.address,
          nonce: await litNodeClient.getLatestBlockhash(),
          litNodeClient,
        });

        return await generateAuthSig({
          signer: userSigner,
          toSign,
        });
      },
    });

    const pkpEthersWallet = new PKPEthersWallet({
      litNodeClient,
      pkpPubKey: process.env.TEST_USER_PKP_PUBKEY!,
      controllerSessionSigs,
    });
    await pkpEthersWallet.init();

    const permitAppResult = await permitApp({
      signer: pkpEthersWallet,
      args: {
        pkpEthAddress: pkpEthersWallet.address,
        appId,
        appVersion: nextAppVersion.newAppVersion,
        // Pre-CBOR2 payload for this case was:
        // permissionData: {
        //   abilityIpfsCids: nextVersionAbilities.abilityIpfsCids,
        //   policyIpfsCids: nextVersionAbilities.abilityPolicies,
        //   policyParameterValues: [
        //     ['0xa1781f6d61784461696c795370656e64696e674c696d6974496e55736443656e7473653130303030'], // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "10000"}
        //     [
        //       '0xa2781f6d61784461696c795370656e64696e674c696d6974496e55736443656e74736535303030306c746f6b656e41646472657373782a307834323030303030303030303030303030303030303030303030303030303030303030303030303036', // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "50000", "tokenAddress": "0x4200000000000000000000000000000000000006"}
        //       '0x', // empty policy var
        //     ],
        //   ],
        // },
        // PermissionData from user-space should always be POJO
        permissionData: {
          [nextVersionAbilities.abilityIpfsCids[0]]: {
            [nextVersionAbilities.abilityPolicies[0][0]]: {
              maxDailySpendingLimitInUsdCents: '10000',
            },
          },
          [nextVersionAbilities.abilityIpfsCids[1]]: {
            [nextVersionAbilities.abilityPolicies[1][0]]: {
              maxDailySpendingLimitInUsdCents: '50000',
              tokenAddress: '0x4200000000000000000000000000000000000006',
            },
            // [nextVersionAbilities.abilityPolicies[1][1]]: Omitted entirely rather than `0x`, because it has no params in this case.
          },
        },
      },
    });

    console.log('Permit app result:', permitAppResult);
    expect(permitAppResult).toHaveProperty('txHash');

    // Get Agent Pkps
    const agentPkpsResult = await getAllRegisteredAgentPkpEthAddresses({
      signer: userSigner,
      args: {
        userAddress: process.env.TEST_USER_PKP_ADDRESS!,
        offset: '0',
      },
    });
    console.log('Agent pkps result:', agentPkpsResult);
    expect(agentPkpsResult.length).toBeGreaterThan(0);

    // Get permitted app version for pkp
    const permittedAppVersionForPkpResult = await getPermittedAppVersionForPkp({
      signer: userSigner,
      args: {
        pkpEthAddress: userSigner.address,
        appId,
      },
    });
    console.log('Permitted app version for pkp result:', permittedAppVersionForPkpResult);
    expect(permittedAppVersionForPkpResult).toBe(nextAppVersion.newAppVersion);

    // Get all permitted app ids for pkp
    const allPermittedAppIdsForPkpResult = await getAllPermittedAppIdsForPkp({
      signer: userSigner,
      args: {
        // pkpTokenId: process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
        pkpEthAddress: userSigner.address,
        offset: '0',
      },
    });
    console.log('All permitted app ids for pkp result:', allPermittedAppIdsForPkpResult);
    expect(allPermittedAppIdsForPkpResult.length).toBeGreaterThan(0);

    // Get all abilities and policies for app
    const allAbilitiesAndPoliciesForAppResult = await getAllAbilitiesAndPoliciesForApp({
      signer: userSigner,
      args: {
        pkpEthAddress: userSigner.address,
        appId,
      },
    });
    expectAssertObject(allAbilitiesAndPoliciesForAppResult);
    console.log('All abilities and policies for app result:', allAbilitiesAndPoliciesForAppResult);
    expect(Object.keys(allAbilitiesAndPoliciesForAppResult).length).toBeGreaterThan(0); // Weak test since the order of the ability is not guaranteed

    await litNodeClient.disconnect();

    // Get delegated agent pkp token ids
    const delegatedAgentPkpTokenIdsResult = await getDelegatedPkpEthAddresses({
      signer: userSigner,
      args: {
        appId,
        version: nextAppVersion.newAppVersion,
        offset: '0',
      },
    });
    console.log('Delegated agent pkp token ids result:', delegatedAgentPkpTokenIdsResult);
    expectAssertArray(delegatedAgentPkpTokenIdsResult);
    expect(delegatedAgentPkpTokenIdsResult.length).toBeGreaterThan(0);

    // Set ability policy parameters
    const setAbilityPolicyParametersResult = await setAbilityPolicyParameters({
      signer: pkpEthersWallet,
      args: {
        pkpEthAddress: pkpEthersWallet.address,
        appId,
        appVersion: nextAppVersion.newAppVersion,
        // Pre-CBOR2 payload for this case was:
        // abilityIpfsCids: [],
        // policyIpfsCids: [[nextVersionAbilities.abilityPolicies[1][1]]], // second policy was never set by the Agent
        // policyParameterValues: [
        //   [
        //     '0xa2781f6d61784461696c795370656e64696e674c696d6974496e55736443656e74736535303030306c746f6b656e41646472657373782a307834323030303030303030303030303030303030303030303030303030303030303030303030303036',
        //   ], //
        // ],
        policyParams: {
          [nextVersionAbilities.abilityIpfsCids[1]]: {
            [nextVersionAbilities.abilityPolicies[1][1]]: {
              maxDailySpendingLimitInUsdCents: '50000',
              tokenAddress: '0x4200000000000000000000000000000000000006',
            },
          },
        },
      },
    });
    console.log('Set ability policy parameters result:', setAbilityPolicyParametersResult);
    expect(setAbilityPolicyParametersResult).toHaveProperty('txHash');

    // Unpermit app
    const unpermitAppResult = await unPermitApp({
      signer: pkpEthersWallet,
      args: {
        pkpEthAddress: pkpEthersWallet.address,
        appId,
        appVersion: nextAppVersion.newAppVersion,
      },
    });
    console.log('Unpermit app result:', unpermitAppResult);
    expect(unpermitAppResult).toHaveProperty('txHash');
  }, 60000);
});
