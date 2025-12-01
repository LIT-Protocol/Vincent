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
import {
  type PermissionData,
  getVincentWrappedKeysAccs,
} from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  generateVincentAbilitySessionSigs,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { createPlatformUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import {
  api as WrappedKeysApi,
  constants as WrappedKeysConstants,
  type StoredKeyData,
} from '@lit-protocol/vincent-wrapped-keys';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { z } from 'zod';

import { bundledVincentAbility as solTransactionSignerBundledAbility } from '../../src';
import {
  createSolanaTransferTransaction,
  fundIfNeeded,
  submitAndVerifyTransaction,
} from './helpers';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Store Encrypted Key E2E Tests', () => {
  const ENV = getEnv({
    SOLANA_RPC_URL: z.string().optional(),
    SOLANA_CLUSTER: z.enum(['devnet', 'testnet', 'mainnet-beta']),
    TEST_SOLANA_FUNDER_PRIVATE_KEY: z.string(),
  });
  const FAUCET_FUND_AMOUNT = 0.01 * LAMPORTS_PER_SOL;
  const TX_SEND_AMOUNT = 0.001 * LAMPORTS_PER_SOL;

  let VINCENT_DEV_ENVIRONMENT: VincentDevEnvironment;
  let LIT_NODE_CLIENT: LitNodeClient;
  let GENERATED_WRAPPED_KEY_ID: string;
  let GENERATED_WRAPPED_KEY_PUBLIC_KEY: string;
  let GENERATED_WRAPPED_KEY_PRIVATE_KEY: string;
  let STORED_KEY_DATA: StoredKeyData;

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

  describe('storeEncryptedKey', () => {
    it('should generate a new Solana keypair and store it as an encrypted wrapped key', async () => {
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

      // Generate a new Solana keypair using @solana/web3.js
      const solanaKeypair = Keypair.generate();
      GENERATED_WRAPPED_KEY_PUBLIC_KEY = solanaKeypair.publicKey.toBase58();
      // Private key must be stored as hex, not base58, because getSolanaKeyPairFromWrappedKey expects hex
      GENERATED_WRAPPED_KEY_PRIVATE_KEY = Buffer.from(solanaKeypair.secretKey).toString('hex');

      console.log('Generated new Solana keypair:', { publicKey: GENERATED_WRAPPED_KEY_PUBLIC_KEY });

      // Get Vincent wrapped keys access control conditions
      const vincentWrappedKeysAccs = await getVincentWrappedKeysAccs({
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
      });

      // Encrypt the private key using Lit Protocol
      const { ciphertext, dataToEncryptHash } = await LIT_NODE_CLIENT.encrypt({
        evmContractConditions: vincentWrappedKeysAccs,
        dataToEncrypt: new TextEncoder().encode(
          `${WrappedKeysConstants.LIT_PREFIX}${GENERATED_WRAPPED_KEY_PRIVATE_KEY}`,
        ),
      });

      console.log('Encrypted Solana private key', { ciphertext, dataToEncryptHash });

      // Store the encrypted key using storeEncryptedKey API
      const memo = 'Test Solana key generated with @solana/web3.js';
      const storedResult = await WrappedKeysApi.storeEncryptedKey({
        jwtToken: platformUserJwt,
        litNodeClient: LIT_NODE_CLIENT,
        publicKey: GENERATED_WRAPPED_KEY_PUBLIC_KEY,
        keyType: WrappedKeysConstants.KEYTYPE_ED25519,
        ciphertext,
        dataToEncryptHash,
        memo,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        evmContractConditions: JSON.stringify(vincentWrappedKeysAccs),
      });

      console.log('Stored encrypted Solana key:', storedResult);

      // Store the key ID for use in subsequent tests
      GENERATED_WRAPPED_KEY_ID = storedResult.id;

      // Verify the key was stored successfully
      expect(storedResult.id).toBeDefined();
      expect(storedResult.delegatorAddress).toBe(VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress);

      // Retrieve and verify the stored key
      STORED_KEY_DATA = await WrappedKeysApi.getEncryptedKey({
        jwtToken: platformUserJwt,
        litNodeClient: LIT_NODE_CLIENT,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        id: storedResult.id,
      });

      expect(STORED_KEY_DATA.id).toBe(storedResult.id);
      expect(STORED_KEY_DATA.publicKey).toBe(GENERATED_WRAPPED_KEY_PUBLIC_KEY);
      expect(STORED_KEY_DATA.memo).toBe(memo);
      expect(STORED_KEY_DATA.delegatorAddress).toBe(
        VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
      );
      expect(STORED_KEY_DATA.keyType).toBe(WrappedKeysConstants.KEYTYPE_ED25519);
      expect(STORED_KEY_DATA.ciphertext).toBe(ciphertext);
      expect(STORED_KEY_DATA.dataToEncryptHash).toBe(dataToEncryptHash);

      console.log('Successfully retrieved and verified stored key');
    });

    it('should decrypt a stored Solana key using exportPrivateKey', async () => {
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
        ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.platformUserPkpWallet,
      });

      console.log('Exporting key stored in previous test:', {
        id: GENERATED_WRAPPED_KEY_ID,
        publicKey: GENERATED_WRAPPED_KEY_PUBLIC_KEY,
      });

      // Export (decrypt) the private key using the platform user JWT
      const exportResult = await WrappedKeysApi.exportPrivateKey({
        jwtToken: platformUserJwt,
        litNodeClient: LIT_NODE_CLIENT,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        id: GENERATED_WRAPPED_KEY_ID,
        delegatorSessionSigs,
      });

      console.log('Exported private key successfully');

      // Verify the exported private key matches the original
      expect(exportResult.decryptedPrivateKey).toBe(GENERATED_WRAPPED_KEY_PRIVATE_KEY);
      expect(exportResult.publicKey).toBe(GENERATED_WRAPPED_KEY_PUBLIC_KEY);

      // Verify we can reconstruct the Solana keypair from the exported private key (hex format)
      const reconstructedKeypair = Keypair.fromSecretKey(
        Buffer.from(exportResult.decryptedPrivateKey, 'hex'),
      );
      expect(reconstructedKeypair.publicKey.toBase58()).toBe(GENERATED_WRAPPED_KEY_PUBLIC_KEY);

      console.log('Successfully verified exported key matches original');
    });

    it('should sign and submit a Solana transfer transaction using the stored key', async () => {
      // Convert the stored public key to Solana PublicKey
      const wrappedKeyPublicKey = new PublicKey(STORED_KEY_DATA.publicKey);

      // Fund the wrapped key's public key address if needed
      await fundIfNeeded({
        solanaCluster: ENV.SOLANA_CLUSTER,
        publicKey: wrappedKeyPublicKey,
        txSendAmount: TX_SEND_AMOUNT,
        faucetFundAmount: FAUCET_FUND_AMOUNT,
        funderPrivateKey: ENV.TEST_SOLANA_FUNDER_PRIVATE_KEY,
      });

      // Create a Solana transfer transaction (send to self for testing)
      const transaction = await createSolanaTransferTransaction({
        solanaCluster: ENV.SOLANA_CLUSTER,
        from: wrappedKeyPublicKey,
        to: wrappedKeyPublicKey,
        lamports: TX_SEND_AMOUNT,
      });

      const serializedTransaction = transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64');

      console.log('Created Solana transfer transaction');

      // Get the Vincent ability client for signing
      const solTransactionSignerAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: solTransactionSignerBundledAbility,
        ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
        debug: false,
      });

      // Execute the ability to sign the transaction
      const executeResult = await solTransactionSignerAbilityClient.execute(
        {
          cluster: ENV.SOLANA_CLUSTER,
          serializedTransaction,
          evmContractConditions: STORED_KEY_DATA.evmContractConditions,
          ciphertext: STORED_KEY_DATA.ciphertext,
          dataToEncryptHash: STORED_KEY_DATA.dataToEncryptHash,
        },
        { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
      );

      console.log('Executed ability to sign transaction');

      // Verify the execution was successful
      expect(executeResult.success).toBe(true);
      expect(executeResult.result).toBeDefined();

      const signedTransaction = (executeResult.result! as { signedTransaction: string })
        .signedTransaction;

      // Validate it's a base64 encoded string
      expect(signedTransaction).toMatch(/^[A-Za-z0-9+/]+=*$/);

      console.log('Transaction signed successfully');

      // Submit the signed transaction to the Solana network and verify it's processed
      await submitAndVerifyTransaction({
        solanaCluster: ENV.SOLANA_CLUSTER,
        signedTransactionBase64: signedTransaction,
        testName: 'should sign and submit a Solana transfer transaction using the stored key',
      });

      console.log('Transaction submitted and verified on Solana network');
    });
  });
});
