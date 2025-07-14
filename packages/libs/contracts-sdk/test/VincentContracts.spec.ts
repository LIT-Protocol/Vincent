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
  getAppsByManager,
  getAppByDelegatee,
  getDelegatedAgentPkpTokenIds,
  getAllRegisteredAgentPkps,
  getPermittedAppVersionForPkp,
  getAllPermittedAppIdsForPkp,
  getAllToolsAndPoliciesForApp,
  setToolPolicyParameters,
  unPermitApp,
  getAppIdByDelegatee,
} from '../src/index';
import { AppVersionTools } from '../src/index';
import { ethers, providers } from 'ethers';
import { config } from '@dotenvx/dotenvx';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import {
  LitActionResource,
  LitPKPResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';

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

if (!process.env.TEST_USER_AGENT_PKP_TOKEN_ID) {
  console.error('TEST_USER_AGENT_PKP_TOKEN_ID environment variable is required');
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

    const appId = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const delegatees = [ethers.Wallet.createRandom().address];

    // Register initial app version
    const initialVersionTools: AppVersionTools = {
      toolIpfsCids: [generateRandomIpfsCid()],
      toolPolicies: [[]],
    };
    const initialAppVersion = await registerApp({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
        delegatees,
        versionTools: initialVersionTools,
      },
      overrides: {
        gasLimit: 10000000,
      },
    });
    console.log('App registration result:', initialAppVersion);
    expect(initialAppVersion).toHaveProperty('txHash');
    expect(initialAppVersion.newAppVersion).toBe('1');

    // Get the app by ID
    const appByIdResult = await getAppById({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
      },
    });
    console.log('App by ID result:', appByIdResult);
    expect(appByIdResult.id).toBe(appId.toString());
    expect(appByIdResult.isDeleted).toBe(false);
    expect(appByIdResult.manager).toBe(appManagerSigner.address);
    expect(appByIdResult.latestVersion).toBe(initialAppVersion.newAppVersion);
    expect(appByIdResult.delegatees).toEqual(delegatees);

    // Disable the initial app version
    const disableAppVersionResult = await enableAppVersion({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
        appVersion: initialAppVersion.newAppVersion,
        enabled: false,
      },
    });
    console.log('Disable app version result:', disableAppVersionResult);
    expect(disableAppVersionResult).toHaveProperty('txHash');
    expect(disableAppVersionResult.success).toBe(true);

    // Get app version
    const appVersionResult = await getAppVersion({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
        version: initialAppVersion.newAppVersion,
      },
    });
    console.log('App version result:', appVersionResult);
    expect(appVersionResult.app.id).toBe(appId.toString());
    expect(appVersionResult.app.isDeleted).toBe(false);
    expect(appVersionResult.app.manager).toBe(appManagerSigner.address);
    expect(appVersionResult.app.latestVersion).toBe(initialAppVersion.newAppVersion);
    expect(appVersionResult.app.delegatees).toEqual(delegatees);

    // // Get all apps by manager
    // const appsByManagerResult = await getAppsByManager({
    //   signer: appManagerSigner,
    //   args: {
    //     manager: appManagerSigner.address,
    //     offset: '0',
    //     limit: '10',
    //   },
    // });
    // console.log('Apps by manager result:', appsByManagerResult);
    // expect(appsByManagerResult.length).toBeGreaterThan(0);

    // Get app by delegatee
    const appByDelegateeResult = await getAppByDelegatee({
      signer: appManagerSigner,
      args: {
        delegatee: delegatees[0],
      },
    });
    console.log('App by delegatee result:', appByDelegateeResult);
    expect(appByDelegateeResult.id).toBe(appId.toString());
    expect(appByDelegateeResult.isDeleted).toBe(false);
    expect(appByDelegateeResult.manager).toBe(appManagerSigner.address);
    expect(appByDelegateeResult.latestVersion).toBe(initialAppVersion.newAppVersion);
    expect(appByDelegateeResult.delegatees).toEqual(delegatees);

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
    const nextVersionTools: AppVersionTools = {
      toolIpfsCids: [initialVersionTools.toolIpfsCids[0], generateRandomIpfsCid()], // one existing & one new tool
      toolPolicies: [
        [generateRandomIpfsCid()], // new policy for the existing tool
        [generateRandomIpfsCid(), generateRandomIpfsCid()], // new policy for the new tool
      ],
    };
    const nextAppVersion = await registerNextVersion({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
        versionTools: nextVersionTools,
      },
    });
    console.log('Next version registration result:', nextAppVersion);
    expect(nextAppVersion).toHaveProperty('txHash');
    expect(nextAppVersion.newAppVersion).toBe('2');

    const initialVersion = parseInt(initialAppVersion.newAppVersion);
    const nextVersion = parseInt(nextAppVersion.newAppVersion);
    expect(nextVersion).toBeGreaterThan(initialVersion);

    // Add a delegatee
    const addDelegateeResult = await addDelegatee({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
        delegatee: ethers.Wallet.createRandom().address,
      },
    });
    console.log('Add delegatee result:', addDelegateeResult);
    expect(addDelegateeResult).toHaveProperty('txHash');
    expect(addDelegateeResult.success).toBe(true);

    // Remove the delegatee
    const removeDelegateeResult = await removeDelegatee({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
        delegatee: delegatees[0],
      },
    });
    console.log('Remove delegatee result:', removeDelegateeResult);
    expect(removeDelegateeResult).toHaveProperty('txHash');
    expect(removeDelegateeResult.success).toBe(true);

    // Delete the app
    const deleteAppResult = await deleteApp({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
      },
    });
    console.log('Delete app result:', deleteAppResult);
    expect(deleteAppResult).toHaveProperty('txHash');
    expect(deleteAppResult.success).toBe(true);

    // Undelete the app
    const undeleteAppResult = await undeleteApp({
      signer: appManagerSigner,
      args: {
        appId: appId.toString(),
      },
    });
    console.log('Undelete app result:', undeleteAppResult);
    expect(undeleteAppResult).toHaveProperty('txHash');
    expect(undeleteAppResult.success).toBe(true);

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
        pkpTokenId: process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
        appId: appId.toString(),
        appVersion: nextAppVersion.newAppVersion,
        permissionData: {
          toolIpfsCids: nextVersionTools.toolIpfsCids,
          policyIpfsCids: nextVersionTools.toolPolicies,
          policyParameterValues: [
            ['0xa1781f6d61784461696c795370656e64696e674c696d6974496e55736443656e7473653130303030'], // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "10000"}
            [
              '0xa2781f6d61784461696c795370656e64696e674c696d6974496e55736443656e74736535303030306c746f6b656e41646472657373782a307834323030303030303030303030303030303030303030303030303030303030303030303030303036', // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "50000", "tokenAddress": "0x4200000000000000000000000000000000000006"}
              '0x', // empty policy var
            ],
          ],
        },
      },
    });

    console.log('Permit app result:', permitAppResult);
    expect(permitAppResult).toHaveProperty('txHash');
    expect(permitAppResult.success).toBe(true);

    // // Get Agent Pkps
    // const agentPkpsResult = await getAllRegisteredAgentPkps({
    //   signer: userSigner,
    //   args: {
    //     userAddress: process.env.TEST_USER_PKP_ADDRESS!,
    //     offset: '0',
    //     limit: '10',
    //   },
    // });
    // console.log('Agent pkps result:', agentPkpsResult);
    // expect(agentPkpsResult.length).toBeGreaterThan(0);
    // expect(agentPkpsResult[0]).toBe(process.env.TEST_USER_AGENT_PKP_TOKEN_ID!);

    // Get permitted app version for pkp
    const permittedAppVersionForPkpResult = await getPermittedAppVersionForPkp({
      signer: userSigner,
      args: {
        pkpTokenId: process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
        appId: appId.toString(),
      },
    });
    console.log('Permitted app version for pkp result:', permittedAppVersionForPkpResult);
    expect(permittedAppVersionForPkpResult).toBe(nextAppVersion.newAppVersion);

    // // Get all permitted app ids for pkp
    // const allPermittedAppIdsForPkpResult = await getAllPermittedAppIdsForPkp({
    //   signer: userSigner,
    //   args: {
    //     pkpTokenId: process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
    //     offset: '0',
    //     limit: '10',
    //   },
    // });
    // console.log('All permitted app ids for pkp result:', allPermittedAppIdsForPkpResult);
    // expect(allPermittedAppIdsForPkpResult.length).toBeGreaterThan(0);

    // Get all tools and policies for app
    const allToolsAndPoliciesForAppResult = await getAllToolsAndPoliciesForApp({
      signer: userSigner,
      args: {
        pkpTokenId: process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
        appId: appId.toString(),
      },
    });
    console.log('All tools and policies for app result:', allToolsAndPoliciesForAppResult);
    expect(allToolsAndPoliciesForAppResult.length).toBeGreaterThan(0); // Weak test since the order of the tool is not guaranteed

    await litNodeClient.disconnect();

    // Get delegated agent pkp token ids
    const delegatedAgentPkpTokenIdsResult = await getDelegatedAgentPkpTokenIds({
      signer: userSigner,
      args: {
        appId: appId.toString(),
        version: nextAppVersion.newAppVersion,
        offset: '0',
        limit: '1',
      },
    });
    console.log('Delegated agent pkp token ids result:', delegatedAgentPkpTokenIdsResult);
    expect(delegatedAgentPkpTokenIdsResult.length).toBeGreaterThan(0);
    expect(delegatedAgentPkpTokenIdsResult[0]).toBe(process.env.TEST_USER_AGENT_PKP_TOKEN_ID!);

    // Set tool policy parameters
    const setToolPolicyParametersResult = await setToolPolicyParameters({
      signer: pkpEthersWallet,
      args: {
        pkpTokenId: process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
        appId: appId.toString(),
        appVersion: nextAppVersion.newAppVersion,
        toolIpfsCids: [nextVersionTools.toolIpfsCids[1]],
        policyIpfsCids: [[nextVersionTools.toolPolicies[1][1]]], // second policy was never set by the Agent
        policyParameterValues: [
          [
            '0xa2781f6d61784461696c795370656e64696e674c696d6974496e55736443656e74736535303030306c746f6b656e41646472657373782a307834323030303030303030303030303030303030303030303030303030303030303030303030303036',
          ], // {"maxDailySpendingLimitInUsdCents": "50000", "tokenAddress": "0x4200000000000000000000000000000000000006"}
        ],
      },
    });
    console.log('Set tool policy parameters result:', setToolPolicyParametersResult);
    expect(setToolPolicyParametersResult).toHaveProperty('txHash');
    expect(setToolPolicyParametersResult.success).toBe(true);

    // Unpermit app
    const unpermitAppResult = await unPermitApp({
      signer: pkpEthersWallet,
      args: {
        pkpTokenId: process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
        appId: appId.toString(),
        appVersion: nextAppVersion.newAppVersion,
      },
    });
    console.log('Unpermit app result:', unpermitAppResult);
    expect(unpermitAppResult).toHaveProperty('txHash');
    expect(unpermitAppResult.success).toBe(true);
  }, 60000);
});
