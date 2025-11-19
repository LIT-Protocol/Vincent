import { formatEther } from 'viem';
import { bundledVincentAbility as solTransactionSignerBundledAbility } from '@lit-protocol/vincent-ability-sol-transaction-signer';
import { constants, api } from '@lit-protocol/vincent-wrapped-keys';
const { exportPrivateKey, generatePrivateKey } = api;

const { LIT_PREFIX } = constants;

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { getClient, getVincentWrappedKeysAccs } from '@lit-protocol/vincent-contracts-sdk';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

import {
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  getTestConfig,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  TestConfig,
  YELLOWSTONE_RPC_URL,
  SOL_RPC_URL,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
} from '../helpers';
import {
  fundAppDelegateeIfNeeded,
  permitAppVersionForAgentWalletPkp,
  permitAbilitiesForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from '../helpers/setup-fixtures';
import * as util from 'node:util';
import { privateKeyToAccount } from 'viem/accounts';

import { checkShouldMintCapacityCredit } from '../helpers/check-mint-capcity-credit';
import { LIT_ABILITY, LIT_NETWORK } from '@lit-protocol/constants';
import { fundIfNeeded } from './helpers/fundIfNeeded';
import { submitAndVerifyTransaction } from './helpers/submitAndVerifyTx';
import { createSolanaTransferTransaction } from './helpers/createSolTransferTx';
import { createSolanaVersionedTransferTransaction } from './helpers/createVersionedSolTransferTx';
import type { AuthSig, ILitResource } from '@lit-protocol/types';
import {
  createSiweMessage,
  generateAuthSig,
  LitAccessControlConditionResource,
} from '@lit-protocol/auth-helpers';

const SOLANA_CLUSTER = 'devnet';

// delegator sessionsigs must allow decryption of access control condition restricted resources
const getDelegatorSessionSigs = async ({
  litNodeClient,
  ethersSigner,
  capacityDelegationAuthSig,
}: {
  litNodeClient: LitNodeClient;
  ethersSigner: ethers.Signer;
  capacityDelegationAuthSig?: AuthSig;
}) => {
  return litNodeClient.getSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 2).toISOString(), // 2 minutes
    capabilityAuthSigs: capacityDelegationAuthSig ? [capacityDelegationAuthSig] : [],
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*') as ILitResource,
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: await ethersSigner.getAddress(),
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient: litNodeClient,
      });

      return await generateAuthSig({
        signer: ethersSigner,
        toSign,
      });
    },
  });
};

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

const contractClient = getClient({
  signer: new ethers.Wallet(
    TEST_APP_MANAGER_PRIVATE_KEY,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  ),
});

// Create a delegatee wallet for ability execution
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

const getSolanaTransactionSignerAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: solTransactionSignerBundledAbility,
    ethersSigner: getDelegateeWallet(),
    debug: true,
  });
};

describe('Solana Transaction Signer Ability E2E Tests', () => {
  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // Solana Transaction Signer Ability has no policies
    [solTransactionSignerBundledAbility.ipfsCid]: {},
  };

  // An array of the IPFS cid of each ability to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((abilityIpfsCid) => {
    // Get the policy IPFS CIDs for this ability from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  const FAUCET_FUND_AMOUNT = 0.01 * LAMPORTS_PER_SOL;
  const TX_SEND_AMOUNT = 0.001 * LAMPORTS_PER_SOL;

  let TEST_CONFIG: TestConfig;
  let LIT_NODE_CLIENT: LitNodeClient;
  let TEST_SOLANA_KEYPAIR: Keypair;
  let CIPHERTEXT: string;
  let DATA_TO_ENCRYPT_HASH: string;
  let VINCENT_WRAPPED_KEYS_ACC_CONDITIONS: any;
  let SERIALIZED_TRANSACTION: string;
  let VERSIONED_SERIALIZED_TRANSACTION: string;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentAbilityClients();
    await LIT_NODE_CLIENT.disconnect();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The App Manager needs to have Lit test tokens
    // in order to interact with the Vincent contract
    const appManagerLitTestTokenBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address,
    });
    if (appManagerLitTestTokenBalance === 0n) {
      throw new Error(
        `❌ App Manager has no Lit test tokens. Please fund ${
          privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address
        } with Lit test tokens`,
      );
    } else {
      console.log(
        `ℹ️  App Manager has ${formatEther(appManagerLitTestTokenBalance)} Lit test tokens`,
      );
    }

    await fundAppDelegateeIfNeeded();

    LIT_NODE_CLIENT = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: true,
    });
    await LIT_NODE_CLIENT.connect();

    // TODO: TEST_SOLANA_KEYPAIR should be generated by the user PKP (the owner of the agent PKP)
    // const { id, generatedPublicKey } = await generatePrivateKey({
    //   litNodeClient: LIT_NODE_CLIENT,
    //   delegatorAddress: TEST_CONFIG.userPkp!.ethAddress!,
    // TODO: Use actual PKPEthers session sigs; requires minting a PKP for the 'owner wallet' instead of using a raw ethers wallet
    // since Vincent Wrapped Keys are managed (generated) by the user PKP (the owner of the agent PKP)
    // delegatorSessionSigs: await getDelegatorPKPSessionSigs({
    //   litNodeClient: LIT_NODE_CLIENT,
    //   ethersSigner: getDelegatorAg(),
    // }),
    // });

    // TODO: This data should be returned by fetching the key from the wrapped-keys backend only (not static)
    VINCENT_WRAPPED_KEYS_ACC_CONDITIONS = await getVincentWrappedKeysAccs({
      delegatorAddress: TEST_CONFIG.userPkp!.ethAddress!,
    });

    console.log('VINCENT_WRAPPED_KEYS_ACC_CONDITIONS', VINCENT_WRAPPED_KEYS_ACC_CONDITIONS);

    TEST_SOLANA_KEYPAIR = Keypair.generate();
    console.log('TEST_SOLANA_KEYPAIR.publicKey', TEST_SOLANA_KEYPAIR.publicKey.toString());
    // TODO: We won't have the secret key unless we export it using `exportPrivateKey()` (which should be its own test case)
    console.log(
      'TEST_SOLANA_KEYPAIR.secretKey',
      Buffer.from(TEST_SOLANA_KEYPAIR.secretKey).toString('hex'),
    );

    await fundIfNeeded({
      solanaCluster: SOLANA_CLUSTER,
      keypair: TEST_SOLANA_KEYPAIR,
      txSendAmount: TX_SEND_AMOUNT,
      faucetFundAmount: FAUCET_FUND_AMOUNT,
    });

    const transaction = await createSolanaTransferTransaction({
      solanaCluster: SOLANA_CLUSTER,
      from: TEST_SOLANA_KEYPAIR.publicKey,
      to: TEST_SOLANA_KEYPAIR.publicKey,
      lamports: TX_SEND_AMOUNT,
    });

    SERIALIZED_TRANSACTION = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const versionedTransaction = await createSolanaVersionedTransferTransaction({
      solanaCluster: SOLANA_CLUSTER,
      from: TEST_SOLANA_KEYPAIR.publicKey,
      to: TEST_SOLANA_KEYPAIR.publicKey,
      lamports: TX_SEND_AMOUNT,
    });

    VERSIONED_SERIALIZED_TRANSACTION = Buffer.from(versionedTransaction.serialize()).toString(
      'base64',
    );

    // TODO: :hocho: This should not be encrypting locally; encryption, access control condition composition and persistence of the key to the backend is now handled inside of api.generatePrivateKey()
    const { ciphertext, dataToEncryptHash } = await LIT_NODE_CLIENT.encrypt({
      evmContractConditions: VINCENT_WRAPPED_KEYS_ACC_CONDITIONS,
      dataToEncrypt: new TextEncoder().encode(
        `${LIT_PREFIX}${Buffer.from(TEST_SOLANA_KEYPAIR.secretKey).toString('hex')}`,
      ),
    });
    CIPHERTEXT = ciphertext;
    DATA_TO_ENCRYPT_HASH = dataToEncryptHash;
  });

  describe('Setup', () => {
    it('should permit the Solana Transaction Signer Ability for the Agent Wallet PKP', async () => {
      await permitAbilitiesForAgentWalletPkp(
        [solTransactionSignerBundledAbility.ipfsCid],
        TEST_CONFIG,
      );
    });

    it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
      await removeAppDelegateeIfNeeded();
    });

    it('should register a new App', async () => {
      TEST_CONFIG = await registerNewApp(
        TOOL_IPFS_IDS,
        TOOL_POLICIES,
        TEST_CONFIG,
        TEST_CONFIG_PATH,
      );
    });

    it('should permit the App version for the Agent Wallet PKP', async () => {
      await permitAppVersionForAgentWalletPkp(PERMISSION_DATA, TEST_CONFIG);
    });

    it('should validate the Delegatee has permission to execute the Solana Transaction Signer Ability with the Agent Wallet PKP', async () => {
      const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
        delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        abilityIpfsCid: TOOL_IPFS_IDS[0],
      });

      expect(validationResult).toBeDefined();
      expect(validationResult.isPermitted).toBe(true);
      expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
      expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);
      expect(Object.keys(validationResult.decodedPolicies)).toHaveLength(0);
    });
  });

  // TODO: Should only track `id` of a newly generated wrapped key in scope, and fetch the wrapped key from the backend using `fetchPrivateKey()`
  describe.skip('Precheck and Execute testing using Delegatee', () => {
    it('should run precheck and validate transaction deserialization', async () => {
      const client = getSolanaTransactionSignerAbilityClient();
      const precheckResult = await client.precheck(
        {
          rpcUrl: SOL_RPC_URL,
          cluster: SOLANA_CLUSTER,
          serializedTransaction: SERIALIZED_TRANSACTION,
          evmContractConditions: VINCENT_WRAPPED_KEYS_ACC_CONDITIONS,
          ciphertext: CIPHERTEXT,
          dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
        },
        { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
      );

      console.log(
        '[should run precheck and validate transaction deserialization]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      expect(precheckResult.success).toBe(true);
      if (!precheckResult.success) {
        throw new Error(precheckResult.runtimeError);
      }
    });

    it('should run execute and return a signed transaction', async () => {
      const client = getSolanaTransactionSignerAbilityClient();
      const executeResult = await client.execute(
        {
          cluster: SOLANA_CLUSTER,
          serializedTransaction: SERIALIZED_TRANSACTION,
          evmContractConditions: VINCENT_WRAPPED_KEYS_ACC_CONDITIONS,
          ciphertext: CIPHERTEXT,
          dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
        },
        { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
      );

      console.log(
        '[should run execute and return a signed transaction]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.result).toBeDefined();

      const signedTransaction = (executeResult.result! as { signedTransaction: string })
        .signedTransaction;

      // Validate it's a base64 encoded string using regex
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(signedTransaction).toMatch(base64Regex);

      await submitAndVerifyTransaction({
        solanaCluster: SOLANA_CLUSTER,
        signedTransactionBase64: signedTransaction,
        testName: 'should run execute and return a signed transaction',
      });
    });

    it('should run execute with requireAllSignatures set to false', async () => {
      const transaction = await createSolanaTransferTransaction({
        solanaCluster: SOLANA_CLUSTER,
        from: TEST_SOLANA_KEYPAIR.publicKey,
        to: TEST_SOLANA_KEYPAIR.publicKey,
        lamports: TX_SEND_AMOUNT,
      });
      const serializedTransaction = transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64');

      const client = getSolanaTransactionSignerAbilityClient();
      const executeResult = await client.execute(
        {
          cluster: SOLANA_CLUSTER,
          serializedTransaction,
          evmContractConditions: VINCENT_WRAPPED_KEYS_ACC_CONDITIONS,
          ciphertext: CIPHERTEXT,
          dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
          legacyTransactionOptions: {
            requireAllSignatures: false,
            verifySignatures: false,
          },
        },
        { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
      );

      console.log(
        '[should run execute with requireAllSignatures set to false]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.result).toBeDefined();

      const signedTransaction = (executeResult.result! as { signedTransaction: string })
        .signedTransaction;

      // Validate it's a base64 encoded string using regex
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(signedTransaction).toMatch(base64Regex);

      // Note: This transaction should still be valid since it's fully signed
      await submitAndVerifyTransaction({
        solanaCluster: SOLANA_CLUSTER,
        signedTransactionBase64: signedTransaction,
        testName: 'should run execute with requireAllSignatures set to false',
      });
    });

    it('should run execute with validateSignatures set to true', async () => {
      const transaction = await createSolanaTransferTransaction({
        solanaCluster: SOLANA_CLUSTER,
        from: TEST_SOLANA_KEYPAIR.publicKey,
        to: TEST_SOLANA_KEYPAIR.publicKey,
        lamports: TX_SEND_AMOUNT,
      });
      const serializedTransaction = transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64');

      const client = getSolanaTransactionSignerAbilityClient();
      const executeResult = await client.execute(
        {
          cluster: SOLANA_CLUSTER,
          serializedTransaction,
          evmContractConditions: VINCENT_WRAPPED_KEYS_ACC_CONDITIONS,
          ciphertext: CIPHERTEXT,
          dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
          legacyTransactionOptions: {
            requireAllSignatures: true,
            verifySignatures: true,
          },
        },
        { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
      );

      console.log(
        '[should run execute with validateSignatures set to true]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.result).toBeDefined();

      const signedTransaction = (executeResult.result! as { signedTransaction: string })
        .signedTransaction;

      // Validate it's a base64 encoded string using regex
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(signedTransaction).toMatch(base64Regex);

      await submitAndVerifyTransaction({
        solanaCluster: SOLANA_CLUSTER,
        signedTransactionBase64: signedTransaction,
        testName: 'should run execute with validateSignatures set to true',
      });
    });

    it('should run precheck and validate versioned transaction deserialization', async () => {
      const client = getSolanaTransactionSignerAbilityClient();
      const precheckResult = await client.precheck(
        {
          cluster: SOLANA_CLUSTER,
          serializedTransaction: VERSIONED_SERIALIZED_TRANSACTION,
          evmContractConditions: VINCENT_WRAPPED_KEYS_ACC_CONDITIONS,
          ciphertext: CIPHERTEXT,
          dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
        },
        { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
      );

      console.log(
        '[should run precheck and validate versioned transaction deserialization]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      expect(precheckResult.success).toBe(true);
      if (!precheckResult.success) {
        throw new Error(precheckResult.runtimeError);
      }
    });

    it('should run execute and return a signed versioned transaction', async () => {
      const client = getSolanaTransactionSignerAbilityClient();
      const executeResult = await client.execute(
        {
          cluster: SOLANA_CLUSTER,
          serializedTransaction: VERSIONED_SERIALIZED_TRANSACTION,
          evmContractConditions: VINCENT_WRAPPED_KEYS_ACC_CONDITIONS,
          ciphertext: CIPHERTEXT,
          dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
        },
        { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
      );

      console.log(
        '[should run execute and return a signed versioned transaction]',
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.result).toBeDefined();

      const signedTransaction = (executeResult.result! as { signedTransaction: string })
        .signedTransaction;

      // Validate it's a base64 encoded string using regex
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(signedTransaction).toMatch(base64Regex);

      await submitAndVerifyTransaction({
        solanaCluster: SOLANA_CLUSTER,
        signedTransactionBase64: signedTransaction,
        testName: 'should run execute and return a signed versioned transaction',
      });
    });
  });

  describe('Platform User Decryption Testing', () => {
    it('should allow the Platform User to decrypt the Wrapped Key', async () => {
      const platformUserEthersWallet = new ethers.Wallet(
        TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
        new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
      );

      const { capacityDelegationAuthSig } = await LIT_NODE_CLIENT.createCapacityDelegationAuthSig({
        dAppOwnerWallet: getDelegateeWallet(),
        delegateeAddresses: [platformUserEthersWallet.address],
      });

      const delegatorSessionSigs = await getDelegatorSessionSigs({
        litNodeClient: LIT_NODE_CLIENT,
        capacityDelegationAuthSig,
        ethersSigner: getDelegateeWallet(),
      });

      const { decryptedPrivateKey } = await exportPrivateKey({
        delegatorSessionSigs,
        id: 'placeholder', // TODO: Use `id` that was assigned when generating a wrapped key
        litNodeClient: LIT_NODE_CLIENT,
        jwtToken: 'placeholder', // TODO: create a JWT using the owner PKP's PKPEthers wallet
        delegatorAddress: TEST_CONFIG.userPkp!.ethAddress!,
      });

      console.log('decryptedPrivateKey', decryptedPrivateKey);

      expect(decryptedPrivateKey).toBeDefined();

      // Convert both to Base58 and compare
      const expectedBase58 = ethers.utils.base58.encode(TEST_SOLANA_KEYPAIR.secretKey);
      const actualBase58 = ethers.utils.base58.encode(decryptedPrivateKey);

      expect(actualBase58).toBe(expectedBase58);
    });
  });
});
