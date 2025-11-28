import {
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  setupVincentDevelopmentEnvironment,
  type VincentDevEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import {
  type PermissionData,
  getVincentWrappedKeysAccs,
} from '@lit-protocol/vincent-contracts-sdk';
import { disconnectVincentAbilityClients } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { createPlatformUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import {
  api as WrappedKeysApi,
  constants as WrappedKeysConstants,
} from '@lit-protocol/vincent-wrapped-keys';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { Keypair } from '@solana/web3.js';

import { bundledVincentAbility as solTransactionSignerBundledAbility } from '../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Batch Store Encrypted Key E2E Tests', () => {
  const BATCH_SIZE = 3;
  const EXPECTED_WRAPPED_KEY_MEMO_PREFIX = 'Batch store test Solana key';

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

  describe('storeEncryptedKeyBatch', () => {
    it('should batch store multiple Solana keypairs as encrypted wrapped keys', async () => {
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

      // Get Vincent wrapped keys access control conditions
      const vincentWrappedKeysAccs = await getVincentWrappedKeysAccs({
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
      });

      // Generate multiple Solana keypairs and encrypt them
      const keyBatch = await Promise.all(
        Array.from({ length: BATCH_SIZE }, async (_, index) => {
          // Generate a new Solana keypair using @solana/web3.js
          const solanaKeypair = Keypair.generate();
          const publicKey = solanaKeypair.publicKey.toBase58();
          // Private key must be stored as hex, not base58, because getSolanaKeyPairFromWrappedKey expects hex
          const privateKey = Buffer.from(solanaKeypair.secretKey).toString('hex');

          console.log(`Generated Solana keypair ${index + 1}:`, { publicKey });

          // Encrypt the private key using Lit Protocol
          const { ciphertext, dataToEncryptHash } = await LIT_NODE_CLIENT.encrypt({
            evmContractConditions: vincentWrappedKeysAccs,
            dataToEncrypt: new TextEncoder().encode(
              `${WrappedKeysConstants.LIT_PREFIX}${privateKey}`,
            ),
          });

          return {
            publicKey,
            keyType: WrappedKeysConstants.KEYTYPE_ED25519,
            ciphertext,
            dataToEncryptHash,
            memo: `${EXPECTED_WRAPPED_KEY_MEMO_PREFIX} ${index + 1}`,
            evmContractConditions: JSON.stringify(vincentWrappedKeysAccs),
          };
        }),
      );

      console.log(`Encrypted ${BATCH_SIZE} Solana keypairs`);

      // Store the batch of encrypted keys using storeEncryptedKeyBatch API
      const result = await WrappedKeysApi.storeEncryptedKeyBatch({
        jwtToken: platformUserJwt,
        litNodeClient: LIT_NODE_CLIENT,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        keyBatch,
      });

      console.log('Batch stored encrypted keys:', result);

      // Verify the batch result structure
      expect(result.delegatorAddress).toBe(VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress);
      expect(result.ids).toBeDefined();
      expect(Array.isArray(result.ids)).toBe(true);
      expect(result.ids.length).toBe(BATCH_SIZE);

      // Verify each key ID is defined
      result.ids.forEach((id, index) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        console.log(`Stored key ${index + 1}: id=${id}`);
      });

      // Retrieve and verify each stored key
      for (let index = 0; index < BATCH_SIZE; index++) {
        const retrievedKey = await WrappedKeysApi.getEncryptedKey({
          jwtToken: platformUserJwt,
          litNodeClient: LIT_NODE_CLIENT,
          delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
          id: result.ids[index],
        });

        expect(retrievedKey.id).toBe(result.ids[index]);
        expect(retrievedKey.publicKey).toBe(keyBatch[index].publicKey);
        expect(retrievedKey.memo).toBe(`${EXPECTED_WRAPPED_KEY_MEMO_PREFIX} ${index + 1}`);
        expect(retrievedKey.delegatorAddress).toBe(VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress);
        expect(retrievedKey.keyType).toBe(WrappedKeysConstants.KEYTYPE_ED25519);
        expect(retrievedKey.ciphertext).toBe(keyBatch[index].ciphertext);
        expect(retrievedKey.dataToEncryptHash).toBe(keyBatch[index].dataToEncryptHash);

        console.log(`Verified stored key ${index + 1}`);
      }

      console.log('Successfully stored and verified all batch keys');
    });
  });
});
