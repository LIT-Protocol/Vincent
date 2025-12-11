/* eslint-disable @typescript-eslint/no-non-null-assertion */

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
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { createDelegateeJWT, createPlatformUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import * as util from 'node:util';
import { z } from 'zod';
import {
  StoredKeyData,
  type StoredKeyMetadata,
  api as WrappedKeysApi,
  constants as WrappedKeysConstants,
} from '@lit-protocol/vincent-wrapped-keys';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { bundledVincentPolicy as solContractWhitelistBundledPolicy } from '@lit-protocol/vincent-policy-sol-contract-whitelist';

import { bundledVincentAbility as solTransactionSignerBundledAbility } from '../../src';
import {
  createSolanaTransferTransaction,
  createSolanaVersionedTransferTransaction,
  fundIfNeeded,
  submitAndVerifyTransaction,
} from './helpers';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Solana Transaction Signer Ability E2E Tests with Contract Whitelist Policy', () => {
  const ENV = getEnv({
    SOLANA_RPC_URL: z.string().optional(),
    SOLANA_CLUSTER: z.enum(['devnet', 'testnet', 'mainnet-beta']),
    TEST_SOLANA_FUNDER_PRIVATE_KEY: z.string(),
  });
  const FAUCET_FUND_AMOUNT = 0.01 * LAMPORTS_PER_SOL;
  const TX_SEND_AMOUNT = 0.001 * LAMPORTS_PER_SOL;
  const EXPECTED_WRAPPED_KEY_MEMO = 'Test Solana key for ability-sol-transaction-signer';

  let VINCENT_DEV_ENVIRONMENT: VincentDevEnvironment;
  let LIT_NODE_CLIENT: LitNodeClient;
  let FIRST_WRAPPED_KEY_METADATA: StoredKeyMetadata;
  let FIRST_WRAPPED_KEY_DATA: StoredKeyData;
  let WRAPPED_KEY_PUBLIC_KEY: PublicKey;

  beforeAll(async () => {
    await funder.checkFunderBalance();
    await delegatee.ensureAppDelegateeFunded();
    await appManager.ensureAppManagerFunded();

    const chainHelpers = await getChainHelpers();

    await ensureUnexpiredCapacityToken(chainHelpers.wallets.appDelegatee);

    const PERMISSION_DATA: PermissionData = {
      // Solana Transaction Signer Ability has no policies
      [solTransactionSignerBundledAbility.ipfsCid]: {
        [solContractWhitelistBundledPolicy.ipfsCid]: {
          whitelist: {
            devnet: [
              '11111111111111111111111111111111',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
            ],
            'mainnet-beta': [],
          },
        },
      },
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

  describe('[Setup] Fetching existing wrapped key for signing tests', () => {
    it('should list existing Vincent Solana Wrapped Keys for the agent PKP as the platform user', async () => {
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

      const result = await WrappedKeysApi.listEncryptedKeyMetadata({
        jwtToken: platformUserJwt,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        litNodeClient: LIT_NODE_CLIENT,
      });

      console.log('Listed wrapped keys:', result);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Verify the structure of the first key
      FIRST_WRAPPED_KEY_METADATA = result[0];
      expect(FIRST_WRAPPED_KEY_METADATA.id).toBeDefined();
      expect(FIRST_WRAPPED_KEY_METADATA.publicKey).toBeDefined();
      expect(FIRST_WRAPPED_KEY_METADATA.keyType).toBe('ed25519');
      expect(FIRST_WRAPPED_KEY_METADATA.delegatorAddress).toBe(
        VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
      );
      expect(FIRST_WRAPPED_KEY_METADATA.memo).toBe(EXPECTED_WRAPPED_KEY_MEMO);
      expect(FIRST_WRAPPED_KEY_METADATA.litNetwork).toBe(LIT_NETWORK.Datil);
    });

    it('should get the encryption metadata for the wrapped key as the delegatee', async () => {
      const delegateeJwt = await createDelegateeJWT({
        ethersWallet: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
        subjectAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress as `0x${string}`,
        audience: WrappedKeysConstants.WRAPPED_KEYS_JWT_AUDIENCE,
        expiresInMinutes: 60,
      });

      FIRST_WRAPPED_KEY_DATA = await WrappedKeysApi.getEncryptedKey({
        jwtToken: delegateeJwt,
        delegatorAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress,
        litNodeClient: LIT_NODE_CLIENT,
        id: FIRST_WRAPPED_KEY_METADATA.id,
      });

      console.log(
        `Wrapped key encryption metadata for id ${FIRST_WRAPPED_KEY_METADATA.id}:`,
        FIRST_WRAPPED_KEY_DATA,
      );

      // Verify it returns StoredKeyData (includes all metadata fields)
      expect(FIRST_WRAPPED_KEY_DATA.id).toBe(FIRST_WRAPPED_KEY_METADATA.id);
      expect(FIRST_WRAPPED_KEY_DATA.publicKey).toBe(FIRST_WRAPPED_KEY_METADATA.publicKey);
      expect(FIRST_WRAPPED_KEY_DATA.keyType).toBe(FIRST_WRAPPED_KEY_METADATA.keyType);
      expect(FIRST_WRAPPED_KEY_DATA.delegatorAddress).toBe(
        FIRST_WRAPPED_KEY_METADATA.delegatorAddress,
      );
      expect(FIRST_WRAPPED_KEY_DATA.memo).toBe(FIRST_WRAPPED_KEY_METADATA.memo);
      expect(FIRST_WRAPPED_KEY_DATA.litNetwork).toBe(FIRST_WRAPPED_KEY_METADATA.litNetwork);

      // Verify it includes encryption-specific fields (StoredKeyData vs StoredKeyMetadata)
      expect(FIRST_WRAPPED_KEY_DATA.ciphertext).toBeDefined();
      expect(typeof FIRST_WRAPPED_KEY_DATA.ciphertext).toBe('string');
      expect(FIRST_WRAPPED_KEY_DATA.ciphertext.length).toBeGreaterThan(0);

      expect(FIRST_WRAPPED_KEY_DATA.dataToEncryptHash).toBeDefined();
      expect(typeof FIRST_WRAPPED_KEY_DATA.dataToEncryptHash).toBe('string');
      expect(FIRST_WRAPPED_KEY_DATA.dataToEncryptHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash

      expect(FIRST_WRAPPED_KEY_DATA.evmContractConditions).toBeDefined();
      expect(typeof FIRST_WRAPPED_KEY_DATA.evmContractConditions).toBe('string');

      // Create Solana PublicKey from the base58 public key string
      // The actual signing will happen via the wrapped key in the Lit Action
      WRAPPED_KEY_PUBLIC_KEY = new PublicKey(FIRST_WRAPPED_KEY_DATA.publicKey);

      // Fund the wrapped key's public key address if needed
      await fundIfNeeded({
        solanaCluster: ENV.SOLANA_CLUSTER,
        publicKey: WRAPPED_KEY_PUBLIC_KEY,
        txSendAmount: TX_SEND_AMOUNT,
        faucetFundAmount: FAUCET_FUND_AMOUNT,
        funderPrivateKey: ENV.TEST_SOLANA_FUNDER_PRIVATE_KEY,
      });
    });
  });

  describe('Transaction Signing with Vincent Ability - passes program whitelist policy check', () => {
    const BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/;
    const CLUSTER = 'devnet';

    let SERIALIZED_TRANSACTION: string;
    let VERSIONED_SERIALIZED_TRANSACTION: string;

    beforeAll(async () => {
      // Create a legacy Solana transfer transaction (send to self for testing)
      const transaction = await createSolanaTransferTransaction({
        solanaCluster: CLUSTER,
        from: WRAPPED_KEY_PUBLIC_KEY,
        to: WRAPPED_KEY_PUBLIC_KEY,
        lamports: TX_SEND_AMOUNT,
      });

      SERIALIZED_TRANSACTION = transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64');

      // Create a versioned Solana transfer transaction (send to self for testing)
      const versionedTransaction = await createSolanaVersionedTransferTransaction({
        solanaCluster: CLUSTER,
        from: WRAPPED_KEY_PUBLIC_KEY,
        to: WRAPPED_KEY_PUBLIC_KEY,
        lamports: TX_SEND_AMOUNT,
      });

      VERSIONED_SERIALIZED_TRANSACTION = Buffer.from(versionedTransaction.serialize()).toString(
        'base64',
      );
    });

    describe('legacy transaction', () => {
      it('should run precheck and validate transaction deserialization', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const precheckResult = await solTransactionSignerAbilityClient.precheck(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log('Precheck result:', util.inspect(precheckResult, { depth: 10 }));

        expect(precheckResult.success).toBe(true);
        if (!precheckResult.success) {
          throw new Error(precheckResult.runtimeError);
        }
      });

      it('should run execute and return a signed transaction', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const executeResult = await solTransactionSignerAbilityClient.execute(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log('Execute result:', util.inspect(executeResult, { depth: 10 }));

        expect(executeResult.success).toBe(true);
        expect(executeResult.result).toBeDefined();

        const signedTransaction = (executeResult.result! as { signedTransaction: string })
          .signedTransaction;

        // Validate it's a base64 encoded string
        expect(signedTransaction).toMatch(BASE64_REGEX);

        // Submit the signed transaction to the Solana network and verify it's processed
        await submitAndVerifyTransaction({
          solanaCluster: CLUSTER,
          signedTransactionBase64: signedTransaction,
          testName: 'should run execute and return a signed transaction',
        });
      });
    });

    describe('versioned transaction', () => {
      it('should run precheck and validate versioned transaction deserialization', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const precheckResult = await solTransactionSignerAbilityClient.precheck(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: VERSIONED_SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log(
          'Precheck result (versioned transaction):',
          util.inspect(precheckResult, { depth: 10 }),
        );

        expect(precheckResult.success).toBe(true);
        if (!precheckResult.success) {
          throw new Error(precheckResult.runtimeError);
        }
      });

      it('should run execute and return a signed versioned transaction', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const executeResult = await solTransactionSignerAbilityClient.execute(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: VERSIONED_SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log(
          'Execute result (versioned transaction):',
          util.inspect(executeResult, { depth: 10 }),
        );

        expect(executeResult.success).toBe(true);
        expect(executeResult.result).toBeDefined();

        const signedTransaction = (executeResult.result! as { signedTransaction: string })
          .signedTransaction;

        // Validate it's a base64 encoded string
        expect(signedTransaction).toMatch(BASE64_REGEX);

        // Submit the signed transaction to the Solana network and verify it's processed
        await submitAndVerifyTransaction({
          solanaCluster: CLUSTER,
          signedTransactionBase64: signedTransaction,
          testName: 'should run execute and return a signed versioned transaction',
        });
      });
    });
  });

  describe('Transaction Signing with Vincent Ability - fails program whitelist policy check', () => {
    const CLUSTER = 'mainnet-beta';

    let SERIALIZED_TRANSACTION: string;
    let VERSIONED_SERIALIZED_TRANSACTION: string;

    beforeAll(async () => {
      // Create a legacy Solana transfer transaction (send to self for testing)
      const transaction = await createSolanaTransferTransaction({
        solanaCluster: CLUSTER,
        from: WRAPPED_KEY_PUBLIC_KEY,
        to: WRAPPED_KEY_PUBLIC_KEY,
        lamports: TX_SEND_AMOUNT,
      });

      SERIALIZED_TRANSACTION = transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64');

      // Create a versioned Solana transfer transaction (send to self for testing)
      const versionedTransaction = await createSolanaVersionedTransferTransaction({
        solanaCluster: CLUSTER,
        from: WRAPPED_KEY_PUBLIC_KEY,
        to: WRAPPED_KEY_PUBLIC_KEY,
        lamports: TX_SEND_AMOUNT,
      });

      VERSIONED_SERIALIZED_TRANSACTION = Buffer.from(versionedTransaction.serialize()).toString(
        'base64',
      );
    });

    describe('legacy transaction', () => {
      it('should run precheck and fail the policy because transfers are not whitelisted on mainnet-beta', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const precheckResult = await solTransactionSignerAbilityClient.precheck(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log('Precheck result:', util.inspect(precheckResult, { depth: 10 }));

        expect(precheckResult).toBeDefined();
        expect(precheckResult.success).toBe(true);
        if (!precheckResult.success) {
          throw new Error(precheckResult.runtimeError);
        }

        expect(precheckResult.context).toBeDefined();
        expect(precheckResult.context!.policiesContext).toBeDefined();
        expect(precheckResult.context!.policiesContext.allow).toBe(false);
        expect(precheckResult.context!.policiesContext.evaluatedPolicies[0]).toBe(
          '@lit-protocol/vincent-policy-sol-contract-whitelist',
        );

        expect(precheckResult.context?.policiesContext.deniedPolicy).toBeDefined();
        expect(precheckResult.context?.policiesContext.deniedPolicy?.packageName).toBe(
          '@lit-protocol/vincent-policy-sol-contract-whitelist',
        );

        const deniedPolicy = precheckResult.context?.policiesContext.deniedPolicy;
        expect(deniedPolicy!.result).toBeDefined();
        expect((deniedPolicy!.result! as { reason: string }).reason).toContain(
          'Transaction includes non-whitelisted program IDs',
        );
        expect(
          (deniedPolicy!.result! as { nonWhitelistedProgramIds: string[] })
            .nonWhitelistedProgramIds,
        ).toStrictEqual(['11111111111111111111111111111111']);
      });

      it('should run execute and return a signed transaction', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const executeResult = await solTransactionSignerAbilityClient.execute(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log('Execute result:', util.inspect(executeResult, { depth: 10 }));

        expect(executeResult).toBeDefined();
        expect(executeResult.success).toBe(false);

        expect(executeResult.context).toBeDefined();
        expect(executeResult.context!.policiesContext).toBeDefined();
        expect(executeResult.context!.policiesContext.allow).toBe(false);
        expect(executeResult.context!.policiesContext.evaluatedPolicies[0]).toBe(
          '@lit-protocol/vincent-policy-sol-contract-whitelist',
        );

        const deniedPolicy = executeResult.context?.policiesContext.deniedPolicy;
        expect(deniedPolicy!.result).toBeDefined();
        expect((deniedPolicy!.result! as { reason: string }).reason).toContain(
          'Transaction includes non-whitelisted program IDs',
        );
        expect(
          (deniedPolicy!.result! as { nonWhitelistedProgramIds: string[] })
            .nonWhitelistedProgramIds,
        ).toStrictEqual(['11111111111111111111111111111111']);
      });
    });

    describe('versioned transaction', () => {
      it('should run precheck and validate versioned transaction deserialization', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const precheckResult = await solTransactionSignerAbilityClient.precheck(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: VERSIONED_SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log(
          'Precheck result (versioned transaction):',
          util.inspect(precheckResult, { depth: 10 }),
        );

        expect(precheckResult).toBeDefined();
        expect(precheckResult.success).toBe(true);
        if (!precheckResult.success) {
          throw new Error(precheckResult.runtimeError);
        }

        expect(precheckResult.context).toBeDefined();
        expect(precheckResult.context!.policiesContext).toBeDefined();
        expect(precheckResult.context!.policiesContext.allow).toBe(false);
        expect(precheckResult.context!.policiesContext.evaluatedPolicies[0]).toBe(
          '@lit-protocol/vincent-policy-sol-contract-whitelist',
        );

        expect(precheckResult.context?.policiesContext.deniedPolicy).toBeDefined();
        expect(precheckResult.context?.policiesContext.deniedPolicy?.packageName).toBe(
          '@lit-protocol/vincent-policy-sol-contract-whitelist',
        );

        const deniedPolicy = precheckResult.context?.policiesContext.deniedPolicy;
        expect(deniedPolicy!.result).toBeDefined();
        expect((deniedPolicy!.result! as { reason: string }).reason).toContain(
          'Transaction includes non-whitelisted program IDs',
        );
        expect(
          (deniedPolicy!.result! as { nonWhitelistedProgramIds: string[] })
            .nonWhitelistedProgramIds,
        ).toStrictEqual(['11111111111111111111111111111111']);
      });

      it('should run execute and return a signed versioned transaction', async () => {
        const solTransactionSignerAbilityClient = getVincentAbilityClient({
          bundledVincentAbility: solTransactionSignerBundledAbility,
          ethersSigner: VINCENT_DEV_ENVIRONMENT.wallets.appDelegatee,
          debug: false,
        });

        const executeResult = await solTransactionSignerAbilityClient.execute(
          {
            rpcUrl: null,
            cluster: CLUSTER,
            serializedTransaction: VERSIONED_SERIALIZED_TRANSACTION,
            evmContractConditions: FIRST_WRAPPED_KEY_DATA.evmContractConditions,
            ciphertext: FIRST_WRAPPED_KEY_DATA.ciphertext,
            dataToEncryptHash: FIRST_WRAPPED_KEY_DATA.dataToEncryptHash,
          },
          { delegatorPkpEthAddress: VINCENT_DEV_ENVIRONMENT.agentPkpInfo.ethAddress },
        );

        console.log(
          'Execute result (versioned transaction):',
          util.inspect(executeResult, { depth: 10 }),
        );

        expect(executeResult).toBeDefined();
        expect(executeResult.success).toBe(false);

        expect(executeResult.context).toBeDefined();
        expect(executeResult.context!.policiesContext).toBeDefined();
        expect(executeResult.context!.policiesContext.allow).toBe(false);
        expect(executeResult.context!.policiesContext.evaluatedPolicies[0]).toBe(
          '@lit-protocol/vincent-policy-sol-contract-whitelist',
        );

        const deniedPolicy = executeResult.context?.policiesContext.deniedPolicy;
        expect(deniedPolicy!.result).toBeDefined();
        expect((deniedPolicy!.result! as { reason: string }).reason).toContain(
          'Transaction includes non-whitelisted program IDs',
        );
        expect(
          (deniedPolicy!.result! as { nonWhitelistedProgramIds: string[] })
            .nonWhitelistedProgramIds,
        ).toStrictEqual(['11111111111111111111111111111111']);
      });
    });
  });
});
