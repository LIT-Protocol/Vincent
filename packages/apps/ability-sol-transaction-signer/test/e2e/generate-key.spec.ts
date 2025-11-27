import {
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  getEnv,
  setupVincentDevelopmentEnvironment,
  type VincentDevEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  generateVincentAbilitySessionSigs,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { createPlatformUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import { z } from 'zod';
import {
  api as WrappedKeysApi,
  constants as WrappedKeysConstants,
} from '@lit-protocol/vincent-wrapped-keys';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';

import { bundledVincentAbility as solTransactionSignerBundledAbility } from '../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Solana Transaction Signer Ability E2E Tests', () => {
  const ENV = getEnv({
    SOLANA_RPC_URL: z.string().optional(),
    SOLANA_CLUSTER: z.enum(['devnet', 'testnet', 'mainnet-beta']),
  });
  const EXPECTED_WRAPPED_KEY_MEMO = 'Test Solana key for ability-sol-transaction-signer';

  let VINCENT_DEV_ENVIRONMENT: VincentDevEnvironment;
  let LIT_NODE_CLIENT: LitNodeClient;

  beforeAll(async () => {
    await funder.checkFunderBalance();
    await delegatee.ensureAppDelegateeFunded();
    await appManager.ensureAppManagerFunded();

    const chainHelpers = await getChainHelpers();

    await ensureUnexpiredCapacityToken(chainHelpers.wallets.appDelegatee);

    const PERMISSION_DATA: PermissionData = {
      // Solana Transaction Signer Ability has no policies
      [solTransactionSignerBundledAbility.ipfsCid]: {},
    };

    VINCENT_DEV_ENVIRONMENT = await setupVincentDevelopmentEnvironment({
      permissionData: PERMISSION_DATA,
    });

    LIT_NODE_CLIENT = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: false,
    });
    await LIT_NODE_CLIENT.connect();
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
    await LIT_NODE_CLIENT.disconnect();
  });

  describe('Generate Solana Vincent Wrapped Key', () => {
    it('should generate a Solana wrapped key as the platform user', async () => {
      const platformUserJwt = await createPlatformUserJWT({
        // @ts-expect-error - The e2e-test-utils uses ^7.3.1 while app-sdk uses ^7.2.3
        pkpWallet: VINCENT_DEV_ENVIRONMENT.wallets.platformUserPkpWallet,
        pkpInfo: VINCENT_DEV_ENVIRONMENT.platformUserPkpInfo,
        authentication: {
          type: 'EthWallet',
        },
        audience: WrappedKeysConstants.WRAPPED_KEYS_JWT_AUDIENCE,
        expiresInMinutes: 60,
      });

      const delegatorSessionSigs = await generateVincentAbilitySessionSigs({
        // @ts-expect-error - Mismatch between installed Lit package versions
        litNodeClient: LIT_NODE_CLIENT,
        ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
      });

      const result = await WrappedKeysApi.generatePrivateKey({
        jwtToken: platformUserJwt,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        litNodeClient: LIT_NODE_CLIENT,
        network: 'solana',
        memo: EXPECTED_WRAPPED_KEY_MEMO,
        delegatorSessionSigs,
      });

      console.log('Generated wrapped key:', result);
      expect(result.id).toBeDefined();
      expect(result.generatedPublicKey).toBeDefined();
      expect(result.delegatorAddress).toBe(VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress);
    });
  });
});
