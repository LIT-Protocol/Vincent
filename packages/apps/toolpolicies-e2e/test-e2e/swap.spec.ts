import { encodeAbiParameters, formatEther, parseEventLogs } from 'viem';
import { vincentPolicyMetadata as spendingLimitPolicyMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import {
  bundledVincentTool as erc20BundledTool,
  getCurrentAllowance,
  checkNativeTokenBalance,
} from '@lit-protocol/vincent-tool-erc20-approval';

import { bundledVincentTool as uniswapBundledTool } from '@lit-protocol/vincent-tool-uniswap-swap';

import { getVincentToolClient, disconnectVincentToolClients } from '@lit-protocol/vincent-app-sdk';
import { ethers } from 'ethers';

import {
  TestConfig,
  getTestConfig,
  TEST_CONFIG_PATH,
  checkShouldMintAndFundPkp,
  BASE_PUBLIC_CLIENT,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  permitAuthMethods,
  TEST_APP_MANAGER_VIEM_WALLET_CLIENT,
  DATIL_PUBLIC_CLIENT,
  VINCENT_ADDRESS,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_MANAGER_VIEM_ACCOUNT,
  DELEGATEES,
  saveTestConfig,
  TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT,
  APP_NAME,
  APP_DESCRIPTION,
  AUTHORIZED_REDIRECT_URIS,
  DEPLOYMENT_STATUS,
  PARAMETER_TYPE,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  BASE_RPC_URL,
  ETH_RPC_URL,
  YELLOWSTONE_RPC_URL,
} from './helpers';
import {
  VincentAppFacetAbi,
  VincentAppViewFacetAbi,
  VincentUserFacetAbi,
  VincentUserViewFacetAbi,
} from './vincent-contract-abis';
import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import * as util from 'node:util';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

// Create a delegatee wallet for tool execution
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

// Get tool clients for ERC20 approval and Uniswap swap
const getErc20ApprovalToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: erc20BundledTool,
    ethersSigner: getDelegateeWallet(),
  });
};

const getUniswapSwapToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: uniswapBundledTool,
    ethersSigner: getDelegateeWallet(),
  });
};

// Helper methods for common test behaviors
const removeExistingApproval = async (delegatorPkpEthAddress: string) => {
  console.log('Removing approval...');
  const setupClient = getErc20ApprovalToolClient();
  const setupResult = await setupClient.execute(
    {
      rpcUrl: BASE_RPC_URL,
      chainId: 8453,
      spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
      tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
      tokenDecimals: 18,
      tokenAmount: 0,
    },
    {
      delegatorPkpEthAddress,
    },
  );

  expect(setupResult.success).toBe(true);
  if (setupResult.success === false) {
    throw new Error(setupResult.error);
  }

  expect(BigInt(setupResult.result.approvedAmount)).toBe(0n);

  if (setupResult.result.approvalTxHash) {
    console.log('waiting for approval tx to finalize', setupResult.result.approvalTxHash);
    await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: setupResult.result.approvalTxHash as `0x${string}`,
    });
    console.log('approval TX is GTG! continuing');
  }

  return setupResult;
};

const addNewApproval = async (delegatorPkpEthAddress: string, tokenAmount: number) => {
  console.log(`Adding approval for amount: ${tokenAmount}...`);
  const erc20ApprovalToolClient = getErc20ApprovalToolClient();
  const erc20ApprovalExecutionResult = await erc20ApprovalToolClient.execute(
    {
      rpcUrl: BASE_RPC_URL,
      chainId: 8453,
      spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
      tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
      tokenDecimals: 18,
      tokenAmount,
    },
    {
      delegatorPkpEthAddress,
    },
  );

  expect(erc20ApprovalExecutionResult.success).toBe(true);
  if (erc20ApprovalExecutionResult.success === false) {
    throw new Error(erc20ApprovalExecutionResult.error);
  }

  expect(erc20ApprovalExecutionResult.result).toBeDefined();

  if (tokenAmount > 0) {
    expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
  } else {
    expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBe(0n);
  }

  expect(erc20ApprovalExecutionResult.result.tokenAddress).toBe(
    '0x4200000000000000000000000000000000000006',
  );
  expect(erc20ApprovalExecutionResult.result.tokenDecimals).toBe(18);
  expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(
    '0x2626664c2603336E57B271c5C0b26F421741e481',
  );

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

describe('Uniswap Swap Tool E2E Tests', () => {
  const TOOL_IPFS_IDS = [erc20BundledTool.ipfsCid, uniswapBundledTool.ipfsCid];

  const TOOL_POLICIES = [[], [spendingLimitPolicyMetadata.ipfsCid]];
  const TOOL_POLICY_PARAMETER_NAMES = [
    [], // No policies for ERC20_APPROVAL_TOOL, so use empty array
    [['maxDailySpendingLimitInUsdCents']], // Parameters for SPENDING_LIMIT_POLICY_TOOL
  ];
  const TOOL_POLICY_PARAMETER_TYPES = [
    [], // No policies for ERC20_APPROVAL_TOOL, so use empty array
    [[PARAMETER_TYPE.UINT256]], // Parameter types for SPENDING_LIMIT_POLICY_TOOL
  ];
  const TOOL_POLICY_PARAMETER_VALUES = [
    [], // Empty array for the ERC20 Approval Tool (it has no policies)
    [
      [
        // Parameter values for SPENDING_LIMIT_POLICY_TOOL
        encodeAbiParameters(
          [{ type: 'uint256' }],
          [BigInt('1000000000')], // maxDailySpendingLimitInUsdCents $10 USD (8 decimals)
        ),
      ],
    ],
  ];

  let TEST_CONFIG: TestConfig;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentToolClients();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The Agent Wallet PKP needs to have Base ETH and WETH
    // in order to execute the ERC20 Approval and Uniswap Swap Tools
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
      address: TEST_APP_MANAGER_VIEM_ACCOUNT.address,
    });
    if (appManagerLitTestTokenBalance === 0n) {
      throw new Error(
        `❌ App Manager has no Lit test tokens. Please fund ${TEST_APP_MANAGER_VIEM_ACCOUNT.address} with Lit test tokens`,
      );
    } else {
      console.log(
        `ℹ️  App Manager has ${formatEther(appManagerLitTestTokenBalance)} Lit test tokens`,
      );
    }
  });

  it('should permit the ERC20 Approval Tool, Uniswap Swap Tool, and Spending Limit Policy for the Agent Wallet PKP', async () => {
    await permitAuthMethods(
      TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
      TEST_CONFIG.userPkp!.tokenId!,
      [erc20BundledTool.ipfsCid, uniswapBundledTool.ipfsCid, spendingLimitPolicyMetadata.ipfsCid],
    );
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    if (TEST_CONFIG.appId !== null) {
      const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
        address: VINCENT_ADDRESS as `0x${string}`,
        abi: VincentAppFacetAbi,
        functionName: 'removeDelegatee',
        args: [TEST_CONFIG.appId, TEST_APP_DELEGATEE_ACCOUNT.address],
      });

      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });

      expect(txReceipt.status).toBe('success');
      console.log(`Removed Delegatee from App ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
    } else {
      console.log('🔄 No existing App ID found, checking if Delegatee is registered to an App...');

      let registeredApp: {
        id: bigint;
        name: string;
        description: string;
        isDeleted: boolean;
        deploymentStatus: number;
        manager: `0x${string}`;
        latestVersion: bigint;
        delegatees: `0x${string}`[];
        authorizedRedirectUris: string[];
      } | null = null;

      try {
        registeredApp = (await DATIL_PUBLIC_CLIENT.readContract({
          address: VINCENT_ADDRESS as `0x${string}`,
          abi: VincentAppViewFacetAbi,
          functionName: 'getAppByDelegatee',
          args: [TEST_APP_DELEGATEE_ACCOUNT.address],
        })) as typeof registeredApp;

        if (registeredApp!.manager !== TEST_APP_MANAGER_VIEM_ACCOUNT.address) {
          throw new Error(
            `❌ App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}, and TEST_APP_MANAGER_PRIVATE_KEY is not the owner of the App`,
          );
        }

        console.log(
          `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}. Removing Delegatee...`,
        );

        const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
          address: VINCENT_ADDRESS as `0x${string}`,
          abi: VincentAppFacetAbi,
          functionName: 'removeDelegatee',
          args: [registeredApp!.id, TEST_APP_DELEGATEE_ACCOUNT.address],
        });

        const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
          hash: txHash,
        });

        expect(txReceipt.status).toBe('success');
        console.log(`ℹ️  Removed Delegatee from App ID: ${registeredApp!.id}\nTx hash: ${txHash}`);
      } catch (error: unknown) {
        // Check if the error is a DelegateeNotRegistered revert
        if (error instanceof Error && error.message.includes('DelegateeNotRegistered')) {
          console.log(
            `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is not registered to any App.`,
          );
        } else {
          throw new Error(
            `❌ Error checking if delegatee is registered: ${(error as Error).message}`,
          );
        }
      }
    }
  });

  it('should register a new App', async () => {
    const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentAppFacetAbi,
      functionName: 'registerApp',
      args: [
        // AppInfo
        {
          name: APP_NAME,
          description: APP_DESCRIPTION,
          deploymentStatus: DEPLOYMENT_STATUS.DEV,
          authorizedRedirectUris: AUTHORIZED_REDIRECT_URIS,
          delegatees: DELEGATEES,
        },
        // VersionTools
        {
          toolIpfsCids: TOOL_IPFS_IDS,
          toolPolicies: TOOL_POLICIES,
          toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
          toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
        },
      ],
    });

    const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });
    expect(txReceipt.status).toBe('success');

    const parsedLogs = parseEventLogs({
      abi: VincentAppFacetAbi,
      logs: txReceipt.logs,
    });
    // @ts-expect-error eventName exists?
    const appRegisteredLog = parsedLogs.filter((log) => log.eventName === 'NewAppRegistered');
    // @ts-expect-error args exists?
    const newAppId = appRegisteredLog[0].args.appId;

    expect(newAppId).toBeDefined();
    if (TEST_CONFIG.appId !== null) expect(newAppId).toBeGreaterThan(BigInt(TEST_CONFIG.appId));

    TEST_CONFIG.appId = newAppId;
    TEST_CONFIG.appVersion = '1';
    saveTestConfig(TEST_CONFIG_PATH, TEST_CONFIG);
    console.log(`Registered new App with ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    const txHash = await TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT.writeContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentUserFacetAbi,
      functionName: 'permitAppVersion',
      args: [
        BigInt(TEST_CONFIG.userPkp!.tokenId!),
        BigInt(TEST_CONFIG.appId!),
        BigInt(TEST_CONFIG.appVersion!),
        TOOL_IPFS_IDS,
        TOOL_POLICIES,
        TOOL_POLICY_PARAMETER_NAMES,
        TOOL_POLICY_PARAMETER_VALUES,
      ],
    });

    const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });
    expect(txReceipt.status).toBe('success');
    console.log(
      `Permitted App with ID ${TEST_CONFIG.appId} and version ${TEST_CONFIG.appVersion} for Agent Wallet PKP with token id ${TEST_CONFIG.userPkp!.tokenId}\nTx hash: ${txHash}`,
    );
  });

  it('should validate the Delegatee has permission to execute the ERC20 Approval Tool with the Agent Wallet PKP', async () => {
    const validationResult = (await DATIL_PUBLIC_CLIENT.readContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentUserViewFacetAbi,
      functionName: 'validateToolExecutionAndGetPolicies',
      args: [
        TEST_APP_DELEGATEE_ACCOUNT.address,
        BigInt(TEST_CONFIG.userPkp!.tokenId!),
        TOOL_IPFS_IDS[0],
      ],
    })) as {
      isPermitted: boolean;
      appId: bigint;
      appVersion: bigint;
      policies: string[][];
    };

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(BigInt(TEST_CONFIG.appId!));
    expect(validationResult.appVersion).toBe(BigInt(TEST_CONFIG.appVersion!));
    expect(validationResult.policies).toEqual([]);
  });

  it('should validate the Delegatee has permission to execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
    const validationResult = (await DATIL_PUBLIC_CLIENT.readContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentUserViewFacetAbi,
      functionName: 'validateToolExecutionAndGetPolicies',
      args: [
        TEST_APP_DELEGATEE_ACCOUNT.address,
        BigInt(TEST_CONFIG.userPkp!.tokenId!),
        TOOL_IPFS_IDS[1],
      ],
    })) as {
      isPermitted: boolean;
      appId: bigint;
      appVersion: bigint;
      policies: string[][];
    };

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(BigInt(TEST_CONFIG.appId!));
    expect(validationResult.appVersion).toBe(BigInt(TEST_CONFIG.appVersion!));
    expect(validationResult.policies).toEqual([
      {
        policyIpfsCid: spendingLimitPolicyMetadata.ipfsCid,
        parameters: [
          {
            name: 'maxDailySpendingLimitInUsdCents',
            paramType: 2,
            value: encodeAbiParameters(
              [{ type: 'uint256' }],
              [BigInt('1000000000')], // maxDailySpendingLimitInUsdCents $10 USD (8 decimals)
            ),
          },
        ],
      },
    ]);
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    const balance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: TEST_APP_DELEGATEE_ACCOUNT.address,
    });
    if (balance === 0n) {
      const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
        to: TEST_APP_DELEGATEE_ACCOUNT.address,
        value: BigInt(10000000000000000), // 0.01 ETH in wei
      });
      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log(`Funded TEST_APP_DELEGATEE with 0.01 ETH\nTx hash: ${txHash}`);
      expect(txReceipt.status).toBe('success');
    } else {
      expect(balance).toBeGreaterThan(0n);
    }
  });

  it('should successfully run precheck on the Uniswap Swap Tool', async () => {
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
        tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
        owner: TEST_CONFIG.userPkp!.ethAddress!,
        spender: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
      });

      // Convert tokenAmount to bigint for comparison
      const requiredAllowance = ethers.utils.parseUnits('0.0000077', 18).toBigInt();

      // Only add approval if the current allowance is less than the required amount
      if (currentAllowance < requiredAllowance) {
        // Setup: Approve WETH for Uniswap Router
        const erc20ApprovalExecutionResult = await addNewApproval(
          TEST_CONFIG.userPkp!.ethAddress!,
          0.0000077,
        );
        console.log('erc20ApprovalExecutionResult', erc20ApprovalExecutionResult);
        console.log({ erc20ApprovalExecutionResult });
      } else {
        console.log(`Existing allowance (${currentAllowance}) is sufficient, skipping approval`);
      }
    } else {
      console.log('PKP has no native token balance, skipping approval');
    }

    // Test: Run precheck on Uniswap Swap Tool
    const uniswapSwapToolClient = getUniswapSwapToolClient();

    // Call the precheck method with the same parameters used in the execute test
    const precheckResult = await uniswapSwapToolClient.precheck(
      {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: BASE_RPC_URL,
        chainIdForUniswap: 8453,
        tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH
        tokenInDecimals: 18,
        tokenInAmount: 0.0000077,
        tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        tokenOutDecimals: 8,
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
      throw new Error(precheckResult.error);
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
      tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
      owner: TEST_CONFIG.userPkp!.ethAddress!,
      spender: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
    });

    // If there's an existing allowance, remove it first
    if (currentAllowance > 0n) {
      console.log(`Existing allowance found: ${currentAllowance}, removing...`);
      // Setup: First, remove any existing approvals
      await removeExistingApproval(TEST_CONFIG.userPkp!.ethAddress!);

      // Verify the allowance is now 0
      currentAllowance = await getCurrentAllowance({
        provider,
        tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
        owner: TEST_CONFIG.userPkp!.ethAddress!,
        spender: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
      });

      expect(currentAllowance).toBe(0n);
    }

    // Test: Add a new approval
    const erc20ApprovalExecutionResult = await addNewApproval(
      TEST_CONFIG.userPkp!.ethAddress!,
      0.0000077,
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
      tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
      owner: TEST_CONFIG.userPkp!.ethAddress!,
      spender: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
    });

    if (!(currentAllowance > 0n)) {
      // Setup: Add an approval so our test case will be guaranteed one already exists
      await addNewApproval(TEST_CONFIG.userPkp!.ethAddress!, 0.0000077);

      // Verify the allowance is now greater than 0
      currentAllowance = await getCurrentAllowance({
        provider,
        tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
        owner: TEST_CONFIG.userPkp!.ethAddress!,
        spender: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
      });
    }

    expect(currentAllowance).toBeGreaterThan(0n);
    // Convert tokenAmount to bigint for comparison
    const requiredAllowance = ethers.utils.parseUnits('0.0000077', 18).toBigInt();

    // Verify the current allowance is sufficient
    expect(currentAllowance).toBeGreaterThanOrEqual(requiredAllowance);

    console.log('currentAllowance', currentAllowance.toString());
    console.log('requiredAllowance', requiredAllowance.toString());
    // Test: Execute with existing approval
    const erc20ApprovalExecutionResult = await addNewApproval(
      TEST_CONFIG.userPkp!.ethAddress!,
      0.0000077,
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
    expect(erc20ApprovalExecutionResult.result.tokenAddress).toBe(
      '0x4200000000000000000000000000000000000006',
    );
    expect(erc20ApprovalExecutionResult.result.tokenDecimals).toBe(18);
    expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(
      '0x2626664c2603336E57B271c5C0b26F421741e481',
    );
  });

  it('should execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
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
      tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
      owner: TEST_CONFIG.userPkp!.ethAddress!,
      spender: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
    });

    // Convert tokenAmount to bigint for comparison
    const requiredAllowance = ethers.utils.parseUnits('0.0000077', 18).toBigInt();

    // Only add approval if the current allowance is less than the required amount
    if (currentAllowance < requiredAllowance) {
      console.log(`Existing allowance (${currentAllowance}) is insufficient, adding approval...`);
      // Ensure we have a valid approval before executing the swap
      await addNewApproval(TEST_CONFIG.userPkp!.ethAddress!, 0.0000077);
    } else {
      console.log(`Existing allowance (${currentAllowance}) is sufficient, skipping approval`);
    }

    const uniswapSwapToolClient = getUniswapSwapToolClient();
    const uniswapSwapExecutionResult = await uniswapSwapToolClient.execute(
      {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: BASE_RPC_URL,
        chainIdForUniswap: 8453,
        tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH
        tokenInDecimals: 18,
        tokenInAmount: 0.0000077,
        tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        tokenOutDecimals: 8,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    expect(uniswapSwapExecutionResult).toBeDefined();

    expect(uniswapSwapExecutionResult.success).toBe(true);
    if (uniswapSwapExecutionResult.success === false) {
      // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
      throw new Error(uniswapSwapExecutionResult.error);
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
