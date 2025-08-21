import { formatEther } from 'viem';
import { vincentPolicyMetadata as spendingLimitPolicyMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import {
  bundledVincentAbility as erc20BundledAbility,
  checkNativeTokenBalance,
  getCurrentAllowance,
} from '@lit-protocol/vincent-ability-erc20-approval';

import { bundledVincentAbility as uniswapBundledAbility } from '@lit-protocol/vincent-ability-uniswap-swap';

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router';

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

// Spender address for ERC20 approvals - will be dynamically determined by AlphaRouter
let UNISWAP_SPENDER_ADDRESS: string | null = null;

const SWAP_AMOUNT = 50;
const SWAP_TOKEN_IN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'; // DEGEN
const SWAP_TOKEN_IN_DECIMALS = 18;
// const SWAP_AMOUNT = 0.0003;
// const SWAP_TOKEN_IN_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH
// const SWAP_TOKEN_IN_DECIMALS = 18;
const SWAP_TOKEN_OUT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
const SWAP_TOKEN_OUT_DECIMALS = 6;

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
const removeExistingApproval = async (delegatorPkpEthAddress: string) => {
  console.log('Removing approval...');
  const setupClient = getErc20ApprovalAbilityClient();
  const setupResult = await setupClient.execute(
    {
      rpcUrl: BASE_RPC_URL,
      chainId: 8453,
      spenderAddress: UNISWAP_SPENDER_ADDRESS!,
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
    console.log('approval TX is GTG! continuing');
    // Wait for next block to ensure blockchain state is updated
    console.log(`waiting for next block after block ${receipt.blockNumber}...`);
    const targetBlockNumber = receipt.blockNumber + 1n;
    let currentBlockNumber = receipt.blockNumber;

    while (currentBlockNumber < targetBlockNumber) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      currentBlockNumber = await BASE_PUBLIC_CLIENT.getBlockNumber();
    }
    console.log(`next block ${currentBlockNumber} confirmed, blockchain state should be updated`);
  }

  return setupResult;
};

const addNewApproval = async (delegatorPkpEthAddress: string, tokenAmount: number) => {
  console.log(`Adding approval for amount: ${tokenAmount}...`);
  const erc20ApprovalAbilityClient = getErc20ApprovalAbilityClient();
  const erc20ApprovalExecutionResult = await erc20ApprovalAbilityClient.execute(
    {
      rpcUrl: BASE_RPC_URL,
      chainId: 8453,
      spenderAddress: UNISWAP_SPENDER_ADDRESS!,
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
  expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(UNISWAP_SPENDER_ADDRESS);

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

// Helper to get the router address that AlphaRouter will use for our swap
const getUniswapRouterAddress = async (recipient: string): Promise<string> => {
  console.log('Getting Uniswap router address from AlphaRouter...');

  const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
  const router = new AlphaRouter({ chainId: 8453, provider });

  // Create token instances
  const tokenIn = new Token(8453, SWAP_TOKEN_IN_ADDRESS, SWAP_TOKEN_IN_DECIMALS);
  const tokenOut = new Token(8453, SWAP_TOKEN_OUT_ADDRESS, SWAP_TOKEN_OUT_DECIMALS);

  // Convert amount to proper format
  const amountIn = CurrencyAmount.fromRawAmount(
    tokenIn,
    ethers.utils.parseUnits(SWAP_AMOUNT.toString(), 18).toString(),
  );

  // Get route from AlphaRouter to determine which router address it will use
  const slippagePercent = new Percent(50, 10000); // 0.5% slippage
  const routeResult = await router.route(amountIn, tokenOut, TradeType.EXACT_INPUT, {
    recipient,
    slippageTolerance: slippagePercent,
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  });

  if (!routeResult || !routeResult.methodParameters) {
    throw new Error('Failed to get route from AlphaRouter');
  }

  const routerAddress = routeResult.methodParameters.to;
  console.log('AlphaRouter will use router address:', routerAddress);

  return routerAddress;
};

describe('Uniswap Swap Ability E2E Tests', () => {
  const MAX_SPENDING_LIMIT_IN_USD_CENTS = 1000000000n; // $10 USD (8 decimals)
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

    // Dynamically determine the router address that AlphaRouter will use
    UNISWAP_SPENDER_ADDRESS = await getUniswapRouterAddress(TEST_CONFIG.userPkp!.ethAddress!);

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

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    await fundAppDelegateeIfNeeded();
  });

  it('should successfully run precheck on the Uniswap Swap Ability', async () => {
    // Check if the PKP has a native token balance
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    const hasBalance = await checkNativeTokenBalance({
      provider,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
    });

    if (hasBalance) {
      // Check the current allowance
      const currentAllowance = await getCurrentAllowance({
        provider,
        tokenAddress: SWAP_TOKEN_IN_ADDRESS,
        owner: TEST_CONFIG.userPkp!.ethAddress!,
        spender: UNISWAP_SPENDER_ADDRESS!,
      });

      // Convert tokenAmount to bigint for comparison
      const requiredAllowance = ethers.utils.parseUnits(SWAP_AMOUNT.toString(), 18).toBigInt();

      // Only add approval if the current allowance is less than the required amount
      if (currentAllowance < requiredAllowance) {
        // Setup: Approve WETH for Uniswap Router
        const erc20ApprovalExecutionResult = await addNewApproval(
          TEST_CONFIG.userPkp!.ethAddress!,
          SWAP_AMOUNT,
        );
        console.log('erc20ApprovalExecutionResult', erc20ApprovalExecutionResult);
        console.log({ erc20ApprovalExecutionResult });
      } else {
        console.log(`Existing allowance (${currentAllowance}) is sufficient, skipping approval`);
      }
    } else {
      console.log('PKP has no native token balance, skipping approval');
    }

    // Test: Run precheck on Uniswap Swap Ability
    const uniswapSwapAbilityClient = getUniswapSwapAbilityClient();

    // Call the precheck method with the same parameters used in the execute test
    const precheckResult = await uniswapSwapAbilityClient.precheck(
      {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: BASE_RPC_URL,
        chainIdForUniswap: 8453,
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
    console.log('precheckResult', util.inspect(precheckResult, { depth: 10 }));
    expect(precheckResult.success).toBe(true);

    if (precheckResult.success === false) {
      // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
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

    // The precheck should has no result
    expect(precheckResult.result).not.toBeDefined();

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

  it('should add an approval successfully when there is no approval', async () => {
    // Check if the PKP has a native token balance
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    const hasBalance = await checkNativeTokenBalance({
      provider,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
    });

    if (!hasBalance) {
      console.log('PKP has no native token balance, skipping test');
      return;
    }

    // Check the current allowance
    let currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress: SWAP_TOKEN_IN_ADDRESS,
      owner: TEST_CONFIG.userPkp!.ethAddress!,
      spender: UNISWAP_SPENDER_ADDRESS!,
    });

    // If there's an existing allowance, remove it first
    if (currentAllowance > 0n) {
      console.log(`Existing allowance found: ${currentAllowance}, removing...`);
      // Setup: First, remove any existing approvals
      await removeExistingApproval(TEST_CONFIG.userPkp!.ethAddress!);

      // Verify the allowance is now 0
      console.log(
        'current allowance after removal',
        await getCurrentAllowance({
          provider,
          tokenAddress: SWAP_TOKEN_IN_ADDRESS,
          owner: TEST_CONFIG.userPkp!.ethAddress!,
          spender: UNISWAP_SPENDER_ADDRESS!,
        }),
      );
      currentAllowance = await getCurrentAllowance({
        provider,
        tokenAddress: SWAP_TOKEN_IN_ADDRESS,
        owner: TEST_CONFIG.userPkp!.ethAddress!,
        spender: UNISWAP_SPENDER_ADDRESS!,
      });

      expect(currentAllowance).toBe(0n);
    }

    // Test: Add a new approval
    const erc20ApprovalExecutionResult = await addNewApproval(
      TEST_CONFIG.userPkp!.ethAddress!,
      SWAP_AMOUNT,
    );

    console.log('erc20ApprovalExecutionResult', erc20ApprovalExecutionResult);
    console.log({ erc20ApprovalExecutionResult });

    // Verify policy context
    expect(erc20ApprovalExecutionResult.context?.policiesContext).toBeDefined();
    expect(erc20ApprovalExecutionResult.context?.policiesContext.allow).toBe(true);
    expect(erc20ApprovalExecutionResult.context?.policiesContext.evaluatedPolicies.length).toBe(0);
    expect(erc20ApprovalExecutionResult.context?.policiesContext.allowedPolicies).toEqual({});
  });

  it('should succeed without a TX when there is already a valid approval', async () => {
    // Check if the PKP has a native token balance
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    const hasBalance = await checkNativeTokenBalance({
      provider,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
    });

    if (!hasBalance) {
      console.log('PKP has no native token balance, skipping test');
      return;
    }

    // Check the current allowance
    let currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress: SWAP_TOKEN_IN_ADDRESS,
      owner: TEST_CONFIG.userPkp!.ethAddress!,
      spender: UNISWAP_SPENDER_ADDRESS!,
    });

    if (!(currentAllowance > 0n)) {
      // Setup: Add an approval so our test case will be guaranteed one already exists
      await addNewApproval(TEST_CONFIG.userPkp!.ethAddress!, SWAP_AMOUNT);

      // Verify the allowance is now greater than 0
      currentAllowance = await getCurrentAllowance({
        provider,
        tokenAddress: SWAP_TOKEN_IN_ADDRESS,
        owner: TEST_CONFIG.userPkp!.ethAddress!,
        spender: UNISWAP_SPENDER_ADDRESS!,
      });
    }

    expect(currentAllowance).toBeGreaterThan(0n);
    // Convert tokenAmount to bigint for comparison
    const requiredAllowance = ethers.utils.parseUnits(SWAP_AMOUNT.toString(), 18).toBigInt();

    // Verify the current allowance is sufficient
    expect(currentAllowance).toBeGreaterThanOrEqual(requiredAllowance);

    console.log('currentAllowance', currentAllowance.toString());
    console.log('requiredAllowance', requiredAllowance.toString());
    // Test: Execute with existing approval
    const erc20ApprovalExecutionResult = await addNewApproval(
      TEST_CONFIG.userPkp!.ethAddress!,
      SWAP_AMOUNT,
    );

    console.log({ erc20ApprovalExecutionResult });

    // Verify policy context
    expect(erc20ApprovalExecutionResult.context?.policiesContext).toBeDefined();
    expect(erc20ApprovalExecutionResult.context?.policiesContext.allow).toBe(true);
    expect(erc20ApprovalExecutionResult.context?.policiesContext.evaluatedPolicies.length).toBe(0);
    expect(erc20ApprovalExecutionResult.context?.policiesContext.allowedPolicies).toEqual({});

    expect(erc20ApprovalExecutionResult.result).toBeDefined();
    expect(erc20ApprovalExecutionResult.result.approvalTxHash).toBeUndefined();

    // Allowance will decrease after swap
    expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
    expect(erc20ApprovalExecutionResult.result.tokenAddress).toBe(SWAP_TOKEN_IN_ADDRESS);
    expect(erc20ApprovalExecutionResult.result.tokenDecimals).toBe(SWAP_TOKEN_IN_DECIMALS);
    expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(UNISWAP_SPENDER_ADDRESS);
  });

  it('should execute the Uniswap Swap Ability with the Agent Wallet PKP', async () => {
    // Check if the PKP has a native token balance
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    const hasBalance = await checkNativeTokenBalance({
      provider,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
    });

    if (!hasBalance) {
      console.log('PKP has no native token balance, skipping test');
      return;
    }

    // Check the current allowance
    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress: SWAP_TOKEN_IN_ADDRESS,
      owner: TEST_CONFIG.userPkp!.ethAddress!,
      spender: UNISWAP_SPENDER_ADDRESS!,
    });

    // Convert tokenAmount to bigint for comparison
    const requiredAllowance = ethers.utils.parseUnits(SWAP_AMOUNT.toString(), 18).toBigInt();

    // Only add approval if the current allowance is less than the required amount
    if (currentAllowance < requiredAllowance) {
      console.log(`Existing allowance (${currentAllowance}) is insufficient, adding approval...`);
      // Ensure we have a valid approval before executing the swap
      await addNewApproval(TEST_CONFIG.userPkp!.ethAddress!, SWAP_AMOUNT);
    } else {
      console.log(`Existing allowance (${currentAllowance}) is sufficient, skipping approval`);
    }

    const uniswapSwapAbilityClient = getUniswapSwapAbilityClient();
    const uniswapSwapExecutionResult = await uniswapSwapAbilityClient.execute(
      {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: BASE_RPC_URL,
        chainIdForUniswap: 8453,
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
