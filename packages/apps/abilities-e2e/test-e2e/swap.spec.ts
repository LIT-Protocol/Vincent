import { formatEther } from 'viem';
import { vincentPolicyMetadata as spendingLimitPolicyMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { bundledVincentAbility as erc20BundledAbility } from '@lit-protocol/vincent-ability-erc20-approval';

import { bundledVincentAbility as uniswapBundledAbility } from '@lit-protocol/vincent-ability-uniswap-swap';

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import {
  BASE_PUBLIC_CLIENT,
  BASE_RPC_URL,
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  ETH_RPC_URL,
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
import * as util from 'node:util';
import { privateKeyToAccount } from 'viem/accounts';

const SWAP_AMOUNT = 80;
const SWAP_TOKEN_IN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'; // DEGEN
const SWAP_TOKEN_IN_DECIMALS = 18;

// const SWAP_AMOUNT = 0.0003;
// const SWAP_TOKEN_IN_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH
// const SWAP_TOKEN_IN_DECIMALS = 18;

// const SWAP_TOKEN_OUT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
// const SWAP_TOKEN_OUT_DECIMALS = 6;
const SWAP_TOKEN_OUT_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH
const SWAP_TOKEN_OUT_DECIMALS = 18;

const RPC_URL = BASE_RPC_URL;
const CHAIN_ID = 8453;

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

// Get ability clients for ERC20 approval and Uniswap swap
const getErc20ApprovalAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: erc20BundledAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const getUniswapSwapAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: uniswapBundledAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

// Helper methods for common test behaviors
const removeExistingApproval = async (spenderAddress: string, delegatorPkpEthAddress: string) => {
  console.log('Removing approval...');
  const setupClient = getErc20ApprovalAbilityClient();
  const setupResult = await setupClient.execute(
    {
      rpcUrl: RPC_URL,
      chainId: CHAIN_ID,
      spenderAddress,
      tokenAddress: SWAP_TOKEN_IN_ADDRESS,
      tokenDecimals: SWAP_TOKEN_IN_DECIMALS,
      tokenAmount: 0,
      alchemyGasSponsor: false,
    },
    {
      delegatorPkpEthAddress,
    },
  );

  expect(setupResult.success).toBe(true);
  if (setupResult.success === false) {
    throw new Error(setupResult.runtimeError);
  }

  expect(BigInt(setupResult.result.approvedAmount)).toBe(0n);

  if (setupResult.result.approvalTxHash) {
    console.log('waiting for approval tx to finalize', setupResult.result.approvalTxHash);
    const receipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: setupResult.result.approvalTxHash as `0x${string}`,
    });

    // Wait for next block to ensure blockchain state is updated
    console.log(`waiting for next block after block ${receipt.blockNumber}...`);
    const targetBlockNumber = receipt.blockNumber + 1n;
    let currentBlockNumber = receipt.blockNumber;

    while (currentBlockNumber < targetBlockNumber) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      currentBlockNumber = await BASE_PUBLIC_CLIENT.getBlockNumber();
    }
    console.log(`next block ${currentBlockNumber} confirmed`);
  }

  return setupResult;
};

const addNewApproval = async (
  spenderAddress: string,
  delegatorPkpEthAddress: string,
  tokenAmount: number,
) => {
  console.log(`Adding approval for spender ${spenderAddress} for amount: ${tokenAmount}...`);
  const erc20ApprovalAbilityClient = getErc20ApprovalAbilityClient();
  const erc20ApprovalExecutionResult = await erc20ApprovalAbilityClient.execute(
    {
      rpcUrl: RPC_URL,
      chainId: CHAIN_ID,
      spenderAddress,
      tokenAddress: SWAP_TOKEN_IN_ADDRESS,
      tokenDecimals: SWAP_TOKEN_IN_DECIMALS,
      tokenAmount,
      alchemyGasSponsor: false,
    },
    {
      delegatorPkpEthAddress,
    },
  );

  expect(erc20ApprovalExecutionResult.success).toBe(true);
  if (erc20ApprovalExecutionResult.success === false) {
    throw new Error(erc20ApprovalExecutionResult.runtimeError);
  }

  expect(erc20ApprovalExecutionResult.result).toBeDefined();

  if (tokenAmount > 0) {
    expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
  } else {
    expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBe(0n);
  }

  expect(erc20ApprovalExecutionResult.result.tokenAddress).toBe(SWAP_TOKEN_IN_ADDRESS);
  expect(erc20ApprovalExecutionResult.result.tokenDecimals).toBe(SWAP_TOKEN_IN_DECIMALS);
  expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(spenderAddress);

  if (erc20ApprovalExecutionResult.result.approvalTxHash) {
    console.log(
      'waiting for approval tx to finalize',
      erc20ApprovalExecutionResult.result.approvalTxHash,
    );
    await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: erc20ApprovalExecutionResult.result.approvalTxHash as `0x${string}`,
    });
    console.log('approval TX is GTG! continuing');
  }

  return erc20ApprovalExecutionResult;
};

describe('Uniswap Swap Ability E2E Tests', () => {
  const MAX_SPENDING_LIMIT_IN_USD_CENTS = 1000000000n; // $10 USD (8 decimals)

  // Store the route from precheck for use in execute
  let UNISWAP_ROUTE: { to: string; calldata: string; estimatedGasUsed: string } | null = null;

  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // ERC20 Approval Ability has no policies
    [erc20BundledAbility.ipfsCid]: {},

    // Uniswap Swap Ability has the Spending Limit Policy
    [uniswapBundledAbility.ipfsCid]: {
      [spendingLimitPolicyMetadata.ipfsCid]: {
        maxDailySpendingLimitInUsdCents: MAX_SPENDING_LIMIT_IN_USD_CENTS,
      },
    },
  };

  // An array of the IPFS cid of each ability to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((abilityIpfsCid) => {
    // Get the policy IPFS CIDs for this ability from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentAbilityClients();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The Agent Wallet PKP needs to have Base ETH and WETH
    // in order to execute the ERC20 Approval and Uniswap Swap Abilities
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

    const agentWalletPkpBaseWethBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseWethBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base WETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base WETH`,
      );
    } else {
      console.log(
        `ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseWethBalance)} Base WETH`,
      );
    }

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
  });

  it('should permit the ERC20 Approval Ability, Uniswap Swap Ability, and Spending Limit Policy for the Agent Wallet PKP', async () => {
    await permitAbilitiesForAgentWalletPkp(
      [
        erc20BundledAbility.ipfsCid,
        uniswapBundledAbility.ipfsCid,
        spendingLimitPolicyMetadata.ipfsCid,
      ],
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

  it('should validate the Delegatee has permission to execute the ERC20 Approval Ability with the Agent Wallet PKP', async () => {
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

  it('should validate the Delegatee has permission to execute the Uniswap Swap Ability with the Agent Wallet PKP', async () => {
    const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
      delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      abilityIpfsCid: TOOL_IPFS_IDS[1],
    });

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
    expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);

    // Check that we have the spending limit policy
    expect(Object.keys(validationResult.decodedPolicies)).toContain(
      spendingLimitPolicyMetadata.ipfsCid,
    );

    // Check the policy parameters
    const policyParams = validationResult.decodedPolicies[spendingLimitPolicyMetadata.ipfsCid];
    expect(policyParams).toBeDefined();
    expect(policyParams?.maxDailySpendingLimitInUsdCents).toBe(1000000000n);
  });

  it('should successfully run precheck on the Uniswap Swap Ability', async () => {
    const uniswapSwapAbilityClient = getUniswapSwapAbilityClient();

    // First attempt: Run precheck without any approvals
    let precheckResult = await uniswapSwapAbilityClient.precheck(
      {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: RPC_URL,
        chainIdForUniswap: CHAIN_ID,
        tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
        tokenInDecimals: SWAP_TOKEN_IN_DECIMALS,
        tokenInAmount: SWAP_AMOUNT,
        tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
        tokenOutDecimals: SWAP_TOKEN_OUT_DECIMALS,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );
    expect(precheckResult).toBeDefined();
    console.log('First precheckResult', util.inspect(precheckResult, { depth: 10 }));

    // Check if precheck failed due to insufficient allowance
    if (
      !precheckResult.success &&
      precheckResult.result?.reason?.includes('ERC20 allowance check error')
    ) {
      console.log('Precheck failed due to insufficient allowance, handling approval...');

      // Extract spender address from failed precheck response
      const erc20SpenderAddress = precheckResult.result?.erc20SpenderAddress;
      expect(erc20SpenderAddress).toBeDefined();
      console.log(`Using spender address from failed precheck: ${erc20SpenderAddress}`);

      // Approve tokens for the spender address returned by precheck failure
      const erc20ApprovalExecutionResult = await addNewApproval(
        erc20SpenderAddress!,
        TEST_CONFIG.userPkp!.ethAddress!,
        SWAP_AMOUNT,
      );
      console.log('ERC20 approval completed:', erc20ApprovalExecutionResult);

      // Retry precheck after approval
      precheckResult = await uniswapSwapAbilityClient.precheck(
        {
          ethRpcUrl: ETH_RPC_URL,
          rpcUrlForUniswap: RPC_URL,
          chainIdForUniswap: CHAIN_ID,
          tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
          tokenInDecimals: SWAP_TOKEN_IN_DECIMALS,
          tokenInAmount: SWAP_AMOUNT,
          tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
          tokenOutDecimals: SWAP_TOKEN_OUT_DECIMALS,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );
      // Verify the precheck was successful
      expect(precheckResult).toBeDefined();
      console.log('Second precheckResult', util.inspect(precheckResult, { depth: 10 }));
    }

    if (precheckResult.success === false) {
      throw new Error(precheckResult.runtimeError);
    }

    // Verify the context is properly populated
    expect(precheckResult.context).toBeDefined();
    expect(precheckResult.context?.delegation.delegateeAddress).toBeDefined();
    expect(precheckResult.context?.delegation.delegatorPkpInfo.ethAddress).toBe(
      TEST_CONFIG.userPkp!.ethAddress!,
    );

    // Verify policies context
    expect(precheckResult.context?.policiesContext).toBeDefined();
    expect(precheckResult.context?.policiesContext.allow).toBe(true);

    // The precheck should return route data
    expect(precheckResult.result).toBeDefined();
    expect(precheckResult.result.route).toBeDefined();
    expect(precheckResult.result.route).not.toBeNull();
    expect(precheckResult.result.route!.to).toBeDefined();
    expect(precheckResult.result.route!.calldata).toBeDefined();
    expect(precheckResult.result.route!.estimatedGasUsed).toBeDefined();

    // Store the route for use in the execute test
    UNISWAP_ROUTE = precheckResult.result!.route;

    // The policy precheck should return the maxSpendingLimitInUsd and buyAmountInUsd
    const policyPrecheckResult =
      precheckResult.context?.policiesContext.allowedPolicies?.[
        '@lit-protocol/vincent-policy-spending-limit'
      ]?.result;
    expect(policyPrecheckResult).toBeDefined();
    // Max spending limit is padded to 8 decimals when returned from the policy
    expect(policyPrecheckResult?.maxSpendingLimitInUsd).toBe(
      Number(MAX_SPENDING_LIMIT_IN_USD_CENTS * 1000000n),
    );
    // Because this is a price, it will fluctuate, so we just check that it's a number and not 0
    expect(policyPrecheckResult?.buyAmountInUsd).toBeGreaterThan(0);
  });

  it('should execute the Uniswap Swap Ability with the Agent Wallet PKP', async () => {
    // Ensure we have a route from the precheck test
    expect(UNISWAP_ROUTE).toBeDefined();
    if (!UNISWAP_ROUTE) {
      throw new Error(
        'No precomputed route available, one should be obtained from the precheck test.',
      );
    }

    const uniswapSwapAbilityClient = getUniswapSwapAbilityClient();
    const uniswapSwapExecutionResult = await uniswapSwapAbilityClient.execute(
      {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: RPC_URL,
        chainIdForUniswap: CHAIN_ID,
        tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
        tokenInDecimals: SWAP_TOKEN_IN_DECIMALS,
        tokenInAmount: SWAP_AMOUNT,
        tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
        tokenOutDecimals: SWAP_TOKEN_OUT_DECIMALS,
        tokenOutAmount: SWAP_AMOUNT,
        route: UNISWAP_ROUTE,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    expect(uniswapSwapExecutionResult).toBeDefined();

    expect(uniswapSwapExecutionResult.success).toBe(true);
    if (uniswapSwapExecutionResult.success === false) {
      // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
      throw new Error(uniswapSwapExecutionResult.runtimeError);
    }

    console.log(uniswapSwapExecutionResult);

    expect(uniswapSwapExecutionResult.result).toBeDefined();
    expect(uniswapSwapExecutionResult.result.swapTxHash).toBeDefined();
    expect(uniswapSwapExecutionResult.result.spendTxHash).toBeDefined();

    const swapTxHash = uniswapSwapExecutionResult.result.swapTxHash;
    expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const swapTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: swapTxHash as `0x${string}`,
    });
    expect(swapTxReceipt.status).toBe('success');

    const spendTxHash = uniswapSwapExecutionResult.result.spendTxHash;
    expect(spendTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const spendTxReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: spendTxHash as `0x${string}`,
    });
    expect(spendTxReceipt.status).toBe('success');
  });
});
