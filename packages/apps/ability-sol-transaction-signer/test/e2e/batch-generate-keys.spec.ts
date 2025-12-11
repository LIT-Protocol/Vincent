import {
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  setupVincentDevelopmentEnvironment,
  type VincentDevEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  generateVincentAbilitySessionSigs,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { createPlatformUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import * as util from 'node:util';
import {
  api as WrappedKeysApi,
  constants as WrappedKeysConstants,
} from '@lit-protocol/vincent-wrapped-keys';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';

import { bundledVincentAbility as solTransactionSignerBundledAbility } from '../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Batch Generate Solana Vincent Wrapped Keys E2E Tests', () => {
  const BATCH_SIZE = 3;
  const EXPECTED_WRAPPED_KEY_MEMO_PREFIX = 'Batch test Solana key';

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

  describe('Batch Generate Solana Vincent Wrapped Keys', () => {
    it('should batch generate multiple Solana wrapped keys as the platform user', async () => {
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

      // Create batch of actions to generate keys
      const actions = Array.from({ length: BATCH_SIZE }, (_, index) => ({
        network: 'solana' as const,
        generateKeyParams: {
          memo: `${EXPECTED_WRAPPED_KEY_MEMO_PREFIX} ${index + 1}`,
        },
      }));

      const result = await WrappedKeysApi.batchGeneratePrivateKeys({
        jwtToken: platformUserJwt,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        litNodeClient: LIT_NODE_CLIENT,
        delegatorSessionSigs,
        actions,
      });

      console.log(
        'Batch generated wrapped keys:',
        util.inspect(result, false, null, true /* enable colors */),
      );

      // Verify the batch result structure
      expect(result.delegatorAddress).toBe(VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBe(BATCH_SIZE);

      // Verify each individual key in the batch
      result.results.forEach((actionResult, index) => {
        const { generateEncryptedPrivateKey } = actionResult;

        expect(generateEncryptedPrivateKey.id).toBeDefined();
        expect(generateEncryptedPrivateKey.generatedPublicKey).toBeDefined();
        expect(generateEncryptedPrivateKey.delegatorAddress).toBe(
          VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        );
        expect(generateEncryptedPrivateKey.memo).toBe(
          `${EXPECTED_WRAPPED_KEY_MEMO_PREFIX} ${index + 1}`,
        );

        console.log(
          `Generated key ${index + 1}: id=${generateEncryptedPrivateKey.id}, publicKey=${generateEncryptedPrivateKey.generatedPublicKey}`,
        );
      });
    });
  });
});
