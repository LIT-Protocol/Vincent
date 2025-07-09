import {
  registerApp,
  registerNextVersion,
  permitApp,
  enableAppVersion,
  addDelegatee,
  removeDelegatee,
  deleteApp,
  undeleteApp,
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
    expect(initialAppVersion).toHaveProperty('newAppVersion');

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
    expect(disableAppVersionResult).toHaveProperty('success');
    expect(disableAppVersionResult.success).toBe(true);

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
    expect(nextAppVersion).toHaveProperty('newAppVersion');

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
    expect(addDelegateeResult).toHaveProperty('success');
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
    expect(removeDelegateeResult).toHaveProperty('success');
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
    expect(deleteAppResult).toHaveProperty('success');
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
    expect(undeleteAppResult).toHaveProperty('success');
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
    expect(permitAppResult).toHaveProperty('success');
    expect(permitAppResult.success).toBe(true);

    await litNodeClient.disconnect();
  }, 30000);
});
