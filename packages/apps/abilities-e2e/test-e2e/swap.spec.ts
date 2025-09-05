import { formatEther } from 'viem';
import { bundledVincentAbility as erc20BundledAbility } from '@lit-protocol/vincent-ability-erc20-approval';

import {
  bundledVincentAbility as uniswapBundledAbility,
  getUniswapQuote,
  type PrepareSignedUniswapQuote,
  getSignedUniswapQuote,
} from '@lit-protocol/vincent-ability-uniswap-swap';

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

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
import * as util from 'node:util';
import { privateKeyToAccount } from 'viem/accounts';

import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import { LIT_NETWORK } from '@lit-protocol/constants';

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

const addNewApproval = async (
  spenderAddress: string,
  delegatorPkpEthAddress: string,
  tokenAmount: number,
) => {
  console.log(`Adding approval for spender ${spenderAddress} for amount: ${tokenAmount}...`);
  const erc20ApprovalAbilityClient = getErc20ApprovalAbilityClient();

  console.log('Executing ERC20 approval...');
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
  // Store the route from precheck for use in execute
  let SIGNED_UNISWAP_QUOTE: PrepareSignedUniswapQuote | null = null;

  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // ERC20 Approval Ability has no policies
    [erc20BundledAbility.ipfsCid]: {},

    // Uniswap Swap Ability has no policies
    [uniswapBundledAbility.ipfsCid]: {},
  };

  // An array of the IPFS cid of each ability to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((abilityIpfsCid) => {
    // Get the policy IPFS CIDs for this ability from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;
  let LIT_NODE_CLIENT: LitNodeClient;

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

    LIT_NODE_CLIENT = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: true,
    });
    await LIT_NODE_CLIENT.connect();
  });

  afterAll(async () => {
    await LIT_NODE_CLIENT.disconnect();
  });

  it('should permit the ERC20 Approval Ability and the Uniswap Swap Ability for the Agent Wallet PKP', async () => {
    await permitAbilitiesForAgentWalletPkp(
      [erc20BundledAbility.ipfsCid, uniswapBundledAbility.ipfsCid],
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
    console.log('validationResult.decodedPolicies', validationResult.decodedPolicies);
    // expect(Object.keys(validationResult.decodedPolicies)).toContain(
    //   spendingLimitPolicyMetadata.ipfsCid,
    // );
  });

  it('should generate a Uniswap route for the swap', async () => {
    console.log('Generating Uniswap route...');
    SIGNED_UNISWAP_QUOTE = await getSignedUniswapQuote({
      quoteParams: {
        rpcUrl: RPC_URL,
        tokenInAddress: SWAP_TOKEN_IN_ADDRESS,
        tokenInAmount: SWAP_AMOUNT.toString(),
        tokenOutAddress: SWAP_TOKEN_OUT_ADDRESS,
        recipient: TEST_CONFIG.userPkp!.ethAddress!,
      },
      ethersSigner: getDelegateeWallet(),
      litNodeClient: LIT_NODE_CLIENT,
    });

    console.log('Signed Uniswap quote:', SIGNED_UNISWAP_QUOTE);
    const { quote } = SIGNED_UNISWAP_QUOTE;
    expect(quote.chainId).toBe(CHAIN_ID);
    expect(quote.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(quote.value).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(quote.calldata).toMatch(/^0x[0-9a-fA-F]+$/);

    expect(quote.tokenIn.toLowerCase()).toMatch(SWAP_TOKEN_IN_ADDRESS.toLowerCase());
    expect(quote.amountIn).toMatch(SWAP_AMOUNT.toString());
    expect(quote.tokenInDecimals).toBe(SWAP_TOKEN_IN_DECIMALS);

    expect(quote.tokenOut.toLowerCase()).toMatch(SWAP_TOKEN_OUT_ADDRESS.toLowerCase());
    expect(quote.amountOut).toMatch(/^\d+(\.\d+)?$/);
    expect(quote.tokenOutDecimals).toBe(SWAP_TOKEN_OUT_DECIMALS);

    expect(quote.quote).toMatch(/^\d+(\.\d+)?$/);
    expect(quote.estimatedGasUsed).toMatch(/^\d+$/);
    expect(quote.estimatedGasUsedUSD).toMatch(/^\d+(\.\d+)?$/);
    expect(typeof quote.blockNumber).toBe('string');
    expect(typeof quote.timestamp).toBe('number');
  });

  it('should handle ERC20 allowance for the Uniswap router', async () => {
    // Ensure we have a route from the generate route test
    expect(SIGNED_UNISWAP_QUOTE).toBeDefined();
    if (!SIGNED_UNISWAP_QUOTE) {
      throw new Error(
        'No precomputed route available, one should be obtained from the generate route test.',
      );
    }

    // Extract spender address from the generated route
    const erc20SpenderAddress = SIGNED_UNISWAP_QUOTE.quote.to;
    console.log(`Using spender address from generated route: ${erc20SpenderAddress}`);

    // First, check if allowance is needed using precheck
    const erc20ApprovalAbilityClient = getErc20ApprovalAbilityClient();
    const precheckResult = await erc20ApprovalAbilityClient.precheck(
      {
        rpcUrl: RPC_URL,
        chainId: CHAIN_ID,
        spenderAddress: erc20SpenderAddress,
        tokenAddress: SWAP_TOKEN_IN_ADDRESS,
        tokenDecimals: SWAP_TOKEN_IN_DECIMALS,
        tokenAmount: SWAP_AMOUNT,
        alchemyGasSponsor: false,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    console.log('ERC20 approval precheck result:', precheckResult);
    expect(precheckResult).toBeDefined();
    expect(precheckResult.success).toBe(true);

    if ('noNativeTokenBalance' in precheckResult.result) {
      throw new Error('No native token balance');
    }

    // Check if allowance is already sufficient based on alreadyApproved flag
    if (precheckResult.result.alreadyApproved) {
      console.log(
        'Sufficient allowance already exists (currentAllowance:',
        precheckResult.result.currentAllowance,
        '), skipping execute',
      );
      expect(precheckResult.result.alreadyApproved).toBe(true);
    } else {
      console.log(
        'Insufficient allowance detected (currentAllowance:',
        precheckResult.result?.currentAllowance,
        '), executing approval...',
      );
      // Need to add approval
      const erc20ApprovalExecutionResult = await addNewApproval(
        erc20SpenderAddress,
        TEST_CONFIG.userPkp!.ethAddress!,
        SWAP_AMOUNT,
      );
      console.log('ERC20 approval completed:', erc20ApprovalExecutionResult);

      expect(erc20ApprovalExecutionResult.success).toBe(true);
      expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
      expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(erc20SpenderAddress);
    }
  });

  it('should successfully run precheck on the Uniswap Swap Ability', async () => {
    // Ensure we have a route from the generate route test
    expect(SIGNED_UNISWAP_QUOTE).toBeDefined();
    if (!SIGNED_UNISWAP_QUOTE) {
      throw new Error(
        'No precomputed route available, one should be obtained from the generate route test.',
      );
    }

    const uniswapSwapAbilityClient = getUniswapSwapAbilityClient();

    const precheckResult = await uniswapSwapAbilityClient.precheck(
      {
        rpcUrlForUniswap: RPC_URL,
        signedUniswapQuote: {
          quote: SIGNED_UNISWAP_QUOTE.quote,
          signature: SIGNED_UNISWAP_QUOTE.signature,
        },
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    expect(precheckResult).toBeDefined();
    console.log('Precheck result', util.inspect(precheckResult, { depth: 10 }));

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
    expect(precheckResult.context?.policiesContext.evaluatedPolicies.length).toBe(0);
  });

  it('should execute the Uniswap Swap Ability with the Agent Wallet PKP', async () => {
    // Ensure we have a route from the generate route test
    expect(SIGNED_UNISWAP_QUOTE).toBeDefined();
    if (!SIGNED_UNISWAP_QUOTE) {
      throw new Error(
        'No precomputed route available, one should be obtained from the generate route test.',
      );
    }

    const uniswapSwapAbilityClient = getUniswapSwapAbilityClient();
    const uniswapSwapExecutionResult = await uniswapSwapAbilityClient.execute(
      {
        rpcUrlForUniswap: RPC_URL,
        signedUniswapQuote: {
          quote: SIGNED_UNISWAP_QUOTE.quote,
          signature: SIGNED_UNISWAP_QUOTE.signature,
        },
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

    const swapTxHash = uniswapSwapExecutionResult.result.swapTxHash;
    expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const swapTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: swapTxHash as `0x${string}`,
    });
    expect(swapTxReceipt.status).toBe('success');
  });
});
