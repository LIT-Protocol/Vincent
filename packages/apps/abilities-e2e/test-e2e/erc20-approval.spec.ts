import { ethers } from 'ethers';
import { bundledVincentAbility as erc20BundledAbility } from '@lit-protocol/vincent-ability-erc20-approval';
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

// Get ability client for ERC20 approval
const getErc20ApprovalAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: erc20BundledAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('ERC20 Approval Ability E2E Tests', () => {
  const ALCHEMY_GAS_SPONSOR_API_KEY = getEnv('ALCHEMY_GAS_SPONSOR_API_KEY');
  const ALCHEMY_GAS_SPONSOR_POLICY_ID = getEnv('ALCHEMY_GAS_SPONSOR_POLICY_ID');
  const UNISWAP_V3_ROUTER_02_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481';
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // ERC20 Approval Ability has no policies
    [erc20BundledAbility.ipfsCid]: {},
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

  // Helper methods for common test behaviors
  const removeExistingApproval = async (delegatorPkpEthAddress: string) => {
    console.log('Removing approval...');
    const client = getErc20ApprovalAbilityClient();
    const result = await client.execute(
      {
        rpcUrl: BASE_RPC_URL,
        chainId: 8453,
        spenderAddress: UNISWAP_V3_ROUTER_02_ADDRESS, // Uniswap V3 Router 02 on Base
        tokenAddress: WETH_ADDRESS, // WETH
        tokenDecimals: 18,
        tokenAmount: 0,
        alchemyGasSponsor: false,
      },
      {
        delegatorPkpEthAddress,
      },
    );

    expect(result.success).toBe(true);
    if (result.success === false) {
      throw new Error(result.runtimeError);
    }

    expect(BigInt(result.result.approvedAmount)).toBe(0n);

    if (result.result.approvalTxHash) {
      console.log('waiting for approval tx to finalize', result.result.approvalTxHash);
      await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: result.result.approvalTxHash as `0x${string}`,
      });
      console.log('approval TX is GTG! continuing');
    }

    return result;
  };

  const addApproval = async (
    delegatorPkpEthAddress: string,
    tokenAmount: number,
    useAlchemySponsor: boolean,
  ) => {
    console.log(`Adding approval for amount: ${tokenAmount}... (sponsor: ${useAlchemySponsor})`);
    const client = getErc20ApprovalAbilityClient();
    const params: any = {
      rpcUrl: BASE_RPC_URL,
      chainId: 8453,
      spenderAddress: UNISWAP_V3_ROUTER_02_ADDRESS, // Uniswap V3 Router 02 on Base
      tokenAddress: WETH_ADDRESS, // WETH
      tokenDecimals: 18,
      tokenAmount,
    };

    if (useAlchemySponsor) {
      params.alchemyGasSponsor = true;
      params.alchemyGasSponsorApiKey = ALCHEMY_GAS_SPONSOR_API_KEY;
      params.alchemyGasSponsorPolicyId = ALCHEMY_GAS_SPONSOR_POLICY_ID;
    }

    const result = await client.execute(params, { delegatorPkpEthAddress });

    expect(result.success).toBe(true);
    if (result.success === false) {
      throw new Error(result.runtimeError);
    }

    expect(result.result).toBeDefined();

    if (tokenAmount > 0) {
      expect(BigInt(result.result.approvedAmount)).toBeGreaterThan(0n);
    } else {
      expect(BigInt(result.result.approvedAmount)).toBe(0n);
    }

    expect(result.result.tokenAddress).toBe(WETH_ADDRESS);
    expect(result.result.tokenDecimals).toBe(18);
    expect(result.result.spenderAddress).toBe(UNISWAP_V3_ROUTER_02_ADDRESS);

    if (result.result.approvalTxHash) {
      // Alchemy returns a userOp hash instead of a tx hash, so we have to interact with alchemy to get the tx hash
      let txHash = result.result.approvalTxHash;
      if (useAlchemySponsor) {
        console.log(
          `converting userOpHash ${result.result.approvalTxHash} to txHash via alchemy...`,
        );
        const uoHash = result.result.approvalTxHash as `0x${string}`;
        txHash = await smartAccountClient.waitForUserOperationTransaction({
          hash: uoHash,
        });
      }
      console.log('waiting for approval tx to finalize', result.result.approvalTxHash);
      await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      console.log('approval TX is GTG! continuing');
    }

    return result;
  };

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

  it('should permit the ERC20 Approval Ability for the Agent Wallet PKP', async () => {
    await permitAbilitiesForAgentWalletPkp([erc20BundledAbility.ipfsCid], TEST_CONFIG);
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

  it('should validate the Delegatee has permission to execute the ERC20 Approval Ability', async () => {
    const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
      delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      abilityIpfsCid: ABILITY_IPFS_IDS[0],
    });

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
    expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);
    expect(Object.keys(validationResult.decodedPolicies)).toHaveLength(0);
  });

  it('should run precheck and indicate allowance status', async () => {
    // Ensure approval is zero first so alreadyApproved=false
    await removeExistingApproval(TEST_CONFIG.userPkp!.ethAddress!);

    const client = getErc20ApprovalAbilityClient();
    const precheckResult = await client.precheck(
      {
        rpcUrl: BASE_RPC_URL,
        chainId: 8453,
        spenderAddress: UNISWAP_V3_ROUTER_02_ADDRESS,
        tokenAddress: WETH_ADDRESS,
        tokenDecimals: 18,
        tokenAmount: 0.0000077,
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should run precheck and indicate allowance status]',
      util.inspect(precheckResult, { depth: 10 }),
    );

    expect(precheckResult.success).toBe(true);
    if (!precheckResult.success) {
      throw new Error(precheckResult.runtimeError);
    }
    expect(precheckResult.result).toBeDefined();
    expect(precheckResult.result!.alreadyApproved).toBe(false);
    expect(precheckResult.result!.currentAllowance).toBe('0');
  });

  it('should add a new approval without sponsorship', async () => {
    // Ensure existing approval is cleared
    await removeExistingApproval(TEST_CONFIG.userPkp!.ethAddress!);

    const execResult = await addApproval(TEST_CONFIG.userPkp!.ethAddress!, 0.0000077, false);
    console.log(
      '[should add a new approval without sponsorship]',
      util.inspect(execResult, { depth: 10 }),
    );

    // Check top-level execution result structure and values
    expect(execResult).toBeDefined();
    expect(execResult.success).toBe(true);

    // Check result object
    expect(execResult.result).toBeDefined();
    expect(typeof execResult.result.approvalTxHash).toBe('string');
    expect(execResult.result.approvalTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(execResult.result.approvedAmount).toBe('7700000000000');
    expect(execResult.result.tokenAddress).toBe(WETH_ADDRESS);
    expect(execResult.result.tokenDecimals).toBe(18);
    expect(execResult.result.spenderAddress).toBe(UNISWAP_V3_ROUTER_02_ADDRESS);
  });

  it('should run precheck and indicate allowance status when there is already a valid approval', async () => {
    const client = getErc20ApprovalAbilityClient();
    const precheckResult = await client.precheck(
      {
        rpcUrl: BASE_RPC_URL,
        chainId: 8453,
        spenderAddress: UNISWAP_V3_ROUTER_02_ADDRESS,
        tokenAddress: WETH_ADDRESS,
        tokenDecimals: 18,
        tokenAmount: 0.0000077,
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should run precheck and indicate allowance status when there is already a valid approval]',
      util.inspect(precheckResult, { depth: 10 }),
    );

    expect(precheckResult.success).toBe(true);
    if (!precheckResult.success) {
      throw new Error(precheckResult.runtimeError);
    }
    expect(precheckResult.result).toBeDefined();
    expect(precheckResult.result!.alreadyApproved).toBe(true);
    expect(precheckResult.result!.currentAllowance).toBe('7700000000000');
  });

  it('should no-op without sponsorship when there is already a valid approval', async () => {
    const client = getErc20ApprovalAbilityClient();
    const result = await client.execute(
      {
        rpcUrl: BASE_RPC_URL,
        chainId: 8453,
        spenderAddress: UNISWAP_V3_ROUTER_02_ADDRESS,
        tokenAddress: WETH_ADDRESS,
        tokenDecimals: 18,
        tokenAmount: 0.0000077,
        alchemyGasSponsor: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should no-op without sponsorship when there is already a valid approval]',
      util.inspect(result, { depth: 10 }),
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error(result.runtimeError);
    }

    // Check result object
    expect(result.result).toBeDefined();
    expect(result.result.approvalTxHash).toBeUndefined();
    expect(result.result.approvedAmount).toBe('7700000000000');
    expect(result.result.tokenAddress).toBe(WETH_ADDRESS);
    expect(result.result.tokenDecimals).toBe(18);
    expect(result.result.spenderAddress).toBe(UNISWAP_V3_ROUTER_02_ADDRESS);
  });

  it('should add a new approval WITH Alchemy sponsorship', async () => {
    // Ensure existing approval is cleared
    await removeExistingApproval(TEST_CONFIG.userPkp!.ethAddress!);

    const execResult = await addApproval(TEST_CONFIG.userPkp!.ethAddress!, 0.0000088, true);
    console.log(
      '[should add a new approval WITH Alchemy sponsorship]',
      util.inspect(execResult, { depth: 10 }),
    );

    expect(execResult).toBeDefined();
    expect(execResult.success).toBe(true);

    // Check result object
    expect(execResult.result).toBeDefined();
    expect(typeof execResult.result.approvalTxHash).toBe('string');
    expect(execResult.result.approvalTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(execResult.result.approvedAmount).toBe('8800000000000');
    expect(execResult.result.tokenAddress).toBe(WETH_ADDRESS);
    expect(execResult.result.tokenDecimals).toBe(18);
    expect(execResult.result.spenderAddress).toBe(UNISWAP_V3_ROUTER_02_ADDRESS);
  });

  it('should no-op WITH Alchemy sponsorship when there is already a valid approval', async () => {
    // Don't need to add approval because it already exists from above test

    const client = getErc20ApprovalAbilityClient();
    const result = await client.execute(
      {
        rpcUrl: BASE_RPC_URL,
        chainId: 8453,
        spenderAddress: UNISWAP_V3_ROUTER_02_ADDRESS,
        tokenAddress: WETH_ADDRESS,
        tokenDecimals: 18,
        tokenAmount: 0.0000088,
        alchemyGasSponsor: true,
        alchemyGasSponsorApiKey: ALCHEMY_GAS_SPONSOR_API_KEY,
        alchemyGasSponsorPolicyId: ALCHEMY_GAS_SPONSOR_POLICY_ID,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );
    console.log(
      '[should no-op WITH Alchemy sponsorship when there is already a valid approval]',
      util.inspect(result, { depth: 10 }),
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error(result.runtimeError);
    }

    // Check result object
    expect(result.result).toBeDefined();
    expect(result.result.approvalTxHash).toBeUndefined();
    expect(result.result.approvedAmount).toBe('8800000000000');
    expect(result.result.tokenAddress).toBe(WETH_ADDRESS);
    expect(result.result.tokenDecimals).toBe(18);
    expect(result.result.spenderAddress).toBe(UNISWAP_V3_ROUTER_02_ADDRESS);
  });
});
