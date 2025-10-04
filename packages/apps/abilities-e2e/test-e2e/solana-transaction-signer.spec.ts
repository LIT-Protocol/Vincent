import { formatEther } from 'viem';
import { bundledVincentAbility as solTransactionSignerBundledAbility } from '@lit-protocol/vincent-ability-sol-transaction-signer';
import { constants } from '@lit-protocol/vincent-wrapped-keys';

const { LIT_PREFIX } = constants;

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  Keypair,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
} from '@solana/web3.js';

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
  TEST_SOLANA_FUNDER_PRIVATE_KEY,
  SOL_RPC_URL,
} from './helpers';
import {
  fundAppDelegateeIfNeeded,
  permitAppVersionForAgentWalletPkp,
  permitAbilitiesForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';
import * as util from 'node:util';
import { privateKeyToAccount } from 'viem/accounts';

import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import { LIT_NETWORK } from '@lit-protocol/constants';

import { api } from '@lit-protocol/vincent-wrapped-keys';
const { getVincentRegistryAccessControlCondition } = api;

const SOLANA_CLUSTER = 'devnet';

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
  });
};

const fundIfNeeded = async ({
  keypair,
  txSendAmount,
  faucetFundAmount,
}: {
  keypair: Keypair;
  txSendAmount: number;
  faucetFundAmount: number;
}) => {
  const connection = new Connection(clusterApiUrl(SOLANA_CLUSTER), 'confirmed');
  const balance = await connection.getBalance(keypair.publicKey);
  console.log('[fundIfNeeded] Current keypair balance:', balance / LAMPORTS_PER_SOL, 'SOL');

  // Calculate minimum required balance (TX_SEND_AMOUNT + estimated gas fees)
  const ESTIMATED_GAS_FEE = 0.000005 * LAMPORTS_PER_SOL; // ~0.000005 SOL for gas

  if (balance < txSendAmount + ESTIMATED_GAS_FEE) {
    console.log('[fundIfNeeded] Balance insufficient, funding from funder account...');
    const funderKeypair = Keypair.fromSecretKey(Buffer.from(TEST_SOLANA_FUNDER_PRIVATE_KEY, 'hex'));

    // Check funder balance
    const funderBalance = await connection.getBalance(funderKeypair.publicKey);
    console.log('[fundIfNeeded] Funder balance:', funderBalance / LAMPORTS_PER_SOL, 'SOL');
    if (funderBalance < faucetFundAmount) {
      throw new Error(
        `Funder account has insufficient balance: ${funderBalance / LAMPORTS_PER_SOL} SOL`,
      );
    }

    // Create transfer transaction from funder to keypair
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: funderKeypair.publicKey,
        toPubkey: keypair.publicKey,
        lamports: faucetFundAmount,
      }),
    );

    // Set recent blockhash and sign
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transferTx.recentBlockhash = blockhash;
    transferTx.feePayer = funderKeypair.publicKey;
    transferTx.sign(funderKeypair);

    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(transferTx.serialize(), {
      skipPreflight: false,
    });

    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed',
    );
    console.log(
      '[fundIfNeeded] Funded keypair with',
      faucetFundAmount / LAMPORTS_PER_SOL,
      'SOL. Tx:',
      signature,
    );

    // Verify new balance
    const newBalance = await connection.getBalance(keypair.publicKey);
    console.log('[fundIfNeeded] New keypair balance:', newBalance / LAMPORTS_PER_SOL, 'SOL');
  } else {
    console.log('[fundIfNeeded] Balance sufficient, no funding needed');
  }
};

const createSolanaTransferTransaction = async (
  from: PublicKey,
  to: PublicKey,
  lamports: number,
) => {
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    }),
  );

  // Fetch recent blockhash from the network
  const connection = new Connection(clusterApiUrl(SOLANA_CLUSTER), 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;

  return transaction;
};

const createSolanaVersionedTransferTransaction = async (
  from: PublicKey,
  to: PublicKey,
  lamports: number,
) => {
  const connection = new Connection(clusterApiUrl(SOLANA_CLUSTER), 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();

  const instructions = [
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    }),
  ];

  const messageV0 = new TransactionMessage({
    payerKey: from,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
};

const submitAndVerifyTransaction = async (signedTransactionBase64: string, testName: string) => {
  const connection = new Connection(clusterApiUrl(SOLANA_CLUSTER), 'confirmed');
  const signedTxBuffer = Buffer.from(signedTransactionBase64, 'base64');

  console.log(`[${testName}] Submitting transaction to Solana network`);
  const signature = await connection.sendRawTransaction(signedTxBuffer, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  console.log(`[${testName}] Transaction signature:`, signature);

  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    'confirmed',
  );
  expect(confirmation.value.err).toBeNull();
  console.log(`[${testName}] Transaction confirmed in block`);

  const txDetails = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  expect(txDetails).toBeDefined();
  expect(txDetails?.slot).toBeGreaterThan(0);
  expect(txDetails?.blockTime).toBeDefined();

  console.log(`[${testName}] Transaction successfully included in block:`, {
    slot: txDetails?.slot,
    blockTime: txDetails?.blockTime,
    signature,
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
  let EVM_CONTRACT_CONDITION: any;
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

    EVM_CONTRACT_CONDITION = await getVincentRegistryAccessControlCondition({
      delegatorAddress: TEST_CONFIG.userPkp!.ethAddress!,
    });

    TEST_SOLANA_KEYPAIR = Keypair.generate();
    console.log('TEST_SOLANA_KEYPAIR.publicKey', TEST_SOLANA_KEYPAIR.publicKey.toString());
    console.log(
      'TEST_SOLANA_KEYPAIR.secretKey',
      Buffer.from(TEST_SOLANA_KEYPAIR.secretKey).toString('hex'),
    );

    await fundIfNeeded({
      keypair: TEST_SOLANA_KEYPAIR,
      txSendAmount: TX_SEND_AMOUNT,
      faucetFundAmount: FAUCET_FUND_AMOUNT,
    });

    const transaction = await createSolanaTransferTransaction(
      TEST_SOLANA_KEYPAIR.publicKey,
      TEST_SOLANA_KEYPAIR.publicKey,
      TX_SEND_AMOUNT,
    );

    SERIALIZED_TRANSACTION = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const versionedTransaction = await createSolanaVersionedTransferTransaction(
      TEST_SOLANA_KEYPAIR.publicKey,
      TEST_SOLANA_KEYPAIR.publicKey,
      TX_SEND_AMOUNT,
    );

    VERSIONED_SERIALIZED_TRANSACTION = Buffer.from(versionedTransaction.serialize()).toString(
      'base64',
    );

    const { ciphertext, dataToEncryptHash } = await LIT_NODE_CLIENT.encrypt({
      evmContractConditions: [EVM_CONTRACT_CONDITION],
      dataToEncrypt: new TextEncoder().encode(
        `${LIT_PREFIX}${Buffer.from(TEST_SOLANA_KEYPAIR.secretKey).toString('hex')}`,
      ),
    });
    CIPHERTEXT = ciphertext;
    DATA_TO_ENCRYPT_HASH = dataToEncryptHash;
  });

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
    TEST_CONFIG = await registerNewApp(TOOL_IPFS_IDS, TOOL_POLICIES, TEST_CONFIG, TEST_CONFIG_PATH);
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

  it('should run precheck and validate transaction deserialization', async () => {
    const client = getSolanaTransactionSignerAbilityClient();
    const precheckResult = await client.precheck(
      {
        rpcUrl: SOL_RPC_URL,
        cluster: SOLANA_CLUSTER,
        serializedTransaction: SERIALIZED_TRANSACTION,
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

    await submitAndVerifyTransaction(
      signedTransaction,
      'should run execute and return a signed transaction',
    );
  });

  it('should run execute with requireAllSignatures set to false', async () => {
    const transaction = await createSolanaTransferTransaction(
      TEST_SOLANA_KEYPAIR.publicKey,
      TEST_SOLANA_KEYPAIR.publicKey,
      TX_SEND_AMOUNT,
    );
    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const client = getSolanaTransactionSignerAbilityClient();
    const executeResult = await client.execute(
      {
        cluster: SOLANA_CLUSTER,
        serializedTransaction,
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
    await submitAndVerifyTransaction(
      signedTransaction,
      'should run execute with requireAllSignatures set to false',
    );
  });

  it('should run execute with validateSignatures set to true', async () => {
    const transaction = await createSolanaTransferTransaction(
      TEST_SOLANA_KEYPAIR.publicKey,
      TEST_SOLANA_KEYPAIR.publicKey,
      TX_SEND_AMOUNT,
    );
    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const client = getSolanaTransactionSignerAbilityClient();
    const executeResult = await client.execute(
      {
        cluster: SOLANA_CLUSTER,
        serializedTransaction,
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

    await submitAndVerifyTransaction(
      signedTransaction,
      'should run execute with validateSignatures set to true',
    );
  });

  it('should run precheck and validate versioned transaction deserialization', async () => {
    const client = getSolanaTransactionSignerAbilityClient();
    const precheckResult = await client.precheck(
      {
        cluster: SOLANA_CLUSTER,
        serializedTransaction: VERSIONED_SERIALIZED_TRANSACTION,
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

    await submitAndVerifyTransaction(
      signedTransaction,
      'should run execute and return a signed versioned transaction',
    );
  });
});
