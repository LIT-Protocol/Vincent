import { ethers } from 'ethers';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-erc20-transfer';
import { vincentPolicyMetadata } from '@lit-protocol/vincent-policy-send-counter';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { formatEther } from 'viem';
import type { ContractClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import * as util from 'node:util';
import { createModularAccountV2Client } from '@account-kit/smart-contracts';
import { LocalAccountSigner, SmartAccountClient } from '@aa-sdk/core';
import { alchemy } from '@account-kit/infra';
import { laUtils } from '@lit-protocol/vincent-scaffold-sdk/la-utils';

import {
  BASE_PUBLIC_CLIENT,
  BASE_RPC_URL,
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  getTestConfig,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  TestConfig,
  YELLOWSTONE_RPC_URL,
} from './helpers';
import {
  fundAppDelegateeIfNeeded,
  permitAppVersionForAgentWalletPkp,
  permitAbilitiesForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';

import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import { getEnv } from './helpers/test-config';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

// Create a delegatee wallet for ability execution
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

// Get ability client for ERC20 transfer
const getErc20TransferAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('ERC20 Transfer Ability E2E Tests', () => {
  const ALCHEMY_GAS_SPONSOR_API_KEY = getEnv('ALCHEMY_GAS_SPONSOR_API_KEY');
  const ALCHEMY_GAS_SPONSOR_POLICY_ID = getEnv('ALCHEMY_GAS_SPONSOR_POLICY_ID');
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    [bundledVincentAbility.ipfsCid]: {
      [vincentPolicyMetadata.ipfsCid]: {
        maxSends: 2,
        timeWindowSeconds: 60,
      },
    },
  };

  // An array of the IPFS cid of each ability to be tested
  const ABILITY_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability (none for approval)
  const ABILITY_POLICIES = ABILITY_IPFS_IDS.map((abilityIpfsCid) => {
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;
  let contractClient: ContractClient;
  let smartAccountClient: SmartAccountClient;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentAbilityClients();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    contractClient = getClient({
      signer: new ethers.Wallet(
        TEST_APP_MANAGER_PRIVATE_KEY,
        new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
      ),
    });

    // The Agent Wallet PKP needs to have Base ETH in order to execute the approval
    const agentWalletPkpBaseEthBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseEthBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base ETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base ETH`,
      );
    } else {
      console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseEthBalance)} Base ETH`);
    }

    // The App Manager needs to have Lit test tokens in order to interact with the Vincent contract
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

    const alchemyChain = laUtils.helpers.getAlchemyChainConfig(8453);

    smartAccountClient = await createModularAccountV2Client({
      mode: '7702' as const,
      transport: alchemy({ apiKey: ALCHEMY_GAS_SPONSOR_API_KEY }),
      chain: alchemyChain,
      // random signing wallet because this is just for converting the userOp hash to a tx hash
      signer: LocalAccountSigner.privateKeyToAccountSigner(
        ethers.Wallet.createRandom().privateKey as `0x${string}`,
      ),
      policyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
    });
  });

  it('should permit the ERC20 Transfer Ability for the Agent Wallet PKP', async () => {
    await permitAbilitiesForAgentWalletPkp([bundledVincentAbility.ipfsCid], TEST_CONFIG);
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    await removeAppDelegateeIfNeeded();
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    await fundAppDelegateeIfNeeded();
  });

  it('should register a new App', async () => {
    TEST_CONFIG = await registerNewApp(
      ABILITY_IPFS_IDS,
      ABILITY_POLICIES,
      TEST_CONFIG,
      TEST_CONFIG_PATH,
    );
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    await permitAppVersionForAgentWalletPkp(PERMISSION_DATA, TEST_CONFIG);
  });

  it('should validate the Delegatee has permission to execute the ERC20 Transfer Ability', async () => {
    const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
      delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      abilityIpfsCid: ABILITY_IPFS_IDS[0],
    });

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
    expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);
    expect(Object.keys(validationResult.decodedPolicies)).toHaveLength(1);
    expect(Object.keys(validationResult.decodedPolicies)[0]).toBe(vincentPolicyMetadata.ipfsCid);
  });

  it('should run precheck and indicate user balance status', async () => {
    const client = getErc20TransferAbilityClient();
    const precheckResult = await client.precheck(
      {
        to: TEST_CONFIG.userPkp!.ethAddress!,
        amount: '0.000000000000000001',
        tokenAddress: WETH_ADDRESS,
        chain: 'base',
        rpcUrl: BASE_RPC_URL,
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should run precheck and indicate user balance status]',
      util.inspect(precheckResult, { depth: 10 }),
    );

    expect(precheckResult.success).toBe(true);
    if (!precheckResult.success) {
      throw new Error(precheckResult.runtimeError);
    }
    expect(precheckResult.result).toBeDefined();
    expect(precheckResult.result!.addressValid).toBe(true);
    expect(precheckResult.result!.amountValid).toBe(true);
    expect(precheckResult.result!.tokenAddressValid).toBe(true);
    expect(BigInt(precheckResult.result!.userBalance)).toBeGreaterThan(0n);
    expect(BigInt(precheckResult.result!.estimatedGas)).toBeGreaterThan(0n);
  });

  it('should execute the ERC20 Transfer Ability without sponsorship', async () => {
    const client = getErc20TransferAbilityClient();
    const execResult = await client.execute(
      {
        to: TEST_CONFIG.userPkp!.ethAddress!,
        amount: '0.000000000000000001',
        tokenAddress: WETH_ADDRESS,
        chain: 'base',
        rpcUrl: BASE_RPC_URL,
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should execute the ERC20 Transfer Ability without sponsorship]',
      util.inspect(execResult, { depth: 10 }),
    );

    // Check top-level execution result structure and values
    expect(execResult).toBeDefined();
    expect(execResult.success).toBe(true);
    if (!execResult.success) {
      throw new Error(execResult.runtimeError);
    }

    // Check result object
    expect(execResult.result).toBeDefined();
    expect(execResult.result.txHash).toBeDefined();
    expect(execResult.result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(execResult.result.to).toBe(TEST_CONFIG.userPkp!.ethAddress!);
    expect(execResult.result.amount).toBe('0.000000000000000001');
    expect(execResult.result.tokenAddress).toBe(WETH_ADDRESS);
    expect(execResult.result.timestamp).toBeDefined();
    expect(execResult.result.timestamp).toBeGreaterThan(0);
  });

  it('should execute the ERC20 Transfer Ability WITH Alchemy sponsorship', async () => {
    const client = getErc20TransferAbilityClient();
    const execResult = await client.execute(
      {
        to: TEST_CONFIG.userPkp!.ethAddress!,
        amount: '0.000000000000000001',
        tokenAddress: WETH_ADDRESS,
        chain: 'base',
        rpcUrl: BASE_RPC_URL,
        alchemyGasSponsor: true,
        alchemyGasSponsorApiKey: ALCHEMY_GAS_SPONSOR_API_KEY,
        alchemyGasSponsorPolicyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should add a new approval WITH Alchemy sponsorship]',
      util.inspect(execResult, { depth: 10 }),
    );

    expect(execResult).toBeDefined();
    expect(execResult.success).toBe(true);
    if (!execResult.success) {
      throw new Error(execResult.runtimeError);
    }

    // Check result object
    expect(execResult.result).toBeDefined();
    expect(execResult.result.txHash).toBeDefined();
    expect(execResult.result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(execResult.result.to).toBe(TEST_CONFIG.userPkp!.ethAddress!);
    expect(execResult.result.amount).toBe('0.000000000000000001');
    expect(execResult.result.tokenAddress).toBe(WETH_ADDRESS);
    expect(execResult.result.timestamp).toBeDefined();
    expect(execResult.result.timestamp).toBeGreaterThan(0);
  });

  it('should fail precheck after exceeding the max sends limit', async () => {
    const client = getErc20TransferAbilityClient();
    const precheckResult = await client.precheck(
      {
        to: TEST_CONFIG.userPkp!.ethAddress!,
        amount: '0.000000000000000001',
        tokenAddress: WETH_ADDRESS,
        chain: 'base',
        rpcUrl: BASE_RPC_URL,
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should fail precheck after exceeding the max sends limit]',
      util.inspect(precheckResult, { depth: 10 }),
    );

    // Verify the precheck was successful
    expect(precheckResult).toBeDefined();
    console.log('precheckResult', util.inspect(precheckResult, { depth: 10 }));
    expect(precheckResult.success).toBe(true);

    if (precheckResult.success === false) {
      throw new Error(precheckResult.runtimeError);
    }

    expect(precheckResult.context).toBeDefined();

    // Verify policies context shows the transaction was denied
    expect(precheckResult.context?.policiesContext).toBeDefined();
    expect(precheckResult.context?.policiesContext.allow).toBe(false);
    expect(precheckResult.context?.policiesContext.evaluatedPolicies[0]).toBe(
      '@lit-protocol/vincent-policy-send-counter-limit',
    );

    // Verify the denied policy details
    expect(precheckResult.context?.policiesContext.deniedPolicy).toBeDefined();
    expect(precheckResult.context?.policiesContext.deniedPolicy?.packageName).toBe(
      '@lit-protocol/vincent-policy-send-counter-limit',
    );

    const deniedPolicy = precheckResult.context?.policiesContext.deniedPolicy;
    expect(deniedPolicy?.result).toBeDefined();
    expect(deniedPolicy?.result?.reason).toContain(
      'Send limit exceeded. Maximum 2 sends per 60 seconds.',
    );
    expect(deniedPolicy?.result?.currentCount).toBe(2);
    expect(deniedPolicy?.result?.maxSends).toBe(2);
    expect(deniedPolicy?.result?.secondsUntilReset).toBeDefined();

    // The ability precheck should still return the deserialized transaction
    expect(precheckResult.result).toBeDefined();
    expect(precheckResult.result!.addressValid).toBe(true);
    expect(precheckResult.result!.amountValid).toBe(true);
    expect(precheckResult.result!.tokenAddressValid).toBe(true);
    expect(BigInt(precheckResult.result!.userBalance)).toBeGreaterThan(0n);
    expect(BigInt(precheckResult.result!.estimatedGas)).toBeGreaterThan(0n);
  });

  it('should fail to execute the ERC20 Transfer Ability after exceeding the max sends limit', async () => {
    const client = getErc20TransferAbilityClient();
    const execResult = await client.execute(
      {
        to: TEST_CONFIG.userPkp!.ethAddress!,
        amount: '0.000000000000000001',
        tokenAddress: WETH_ADDRESS,
        chain: 'base',
        rpcUrl: BASE_RPC_URL,
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should fail to execute the ERC20 Transfer Ability after exceeding the max sends limit]',
      util.inspect(execResult, { depth: 10 }),
    );

    // Verify the execute was successful
    expect(execResult).toBeDefined();
    console.log('execResult', util.inspect(execResult, { depth: 10 }));
    expect(execResult.success).toBe(false);

    // Verify the context is properly populated
    expect(execResult.context).toBeDefined();
    expect(execResult.context?.delegation.delegateeAddress).toBeDefined();
    expect(execResult.context?.delegation.delegatorPkpInfo.ethAddress).toBe(
      TEST_CONFIG.userPkp!.ethAddress!,
    );

    // Verify policies context shows the transaction was denied
    const policiesContext = execResult.context?.policiesContext;
    expect(policiesContext).toBeDefined();
    expect(policiesContext?.allow).toBe(false);
    expect(policiesContext?.evaluatedPolicies[0]).toBe(
      '@lit-protocol/vincent-policy-send-counter-limit',
    );

    // Verify the denied policy details
    const deniedPolicy = policiesContext!.deniedPolicy;
    expect(deniedPolicy).toBeDefined();
    expect(deniedPolicy?.packageName).toBe('@lit-protocol/vincent-policy-send-counter-limit');
    expect(deniedPolicy?.result).toBeDefined();
    expect(deniedPolicy?.result?.reason).toContain(
      'Send limit exceeded during evaluation. Maximum 2 sends per 60 seconds.',
    );
    expect(deniedPolicy?.result?.currentCount).toBe(2);
    expect(deniedPolicy?.result?.maxSends).toBe(2);
    expect(deniedPolicy?.result?.secondsUntilReset).toBeDefined();
  });
});
