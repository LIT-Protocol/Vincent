import { ethers } from 'ethers';
import { VincentToolErc20ApprovalMetadata } from '@lit-protocol/vincent-tool-erc20-approval';
// import { VincentPolicySpendingLimitMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { executeVincentTool, getEnv } from '@lit-protocol/vincent-tool-sdk';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Vincent Tool Uniswap Swap E2E Tests', () => {
  let TEST_UNISWAP_RPC_URL: string | undefined;
  let TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY: string | undefined;
  let TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS: string | undefined;

  beforeAll(async () => {
    TEST_UNISWAP_RPC_URL = getEnv('TEST_UNISWAP_RPC_URL');
    if (TEST_UNISWAP_RPC_URL === undefined) {
      console.error('❌ TEST_UNISWAP_RPC_URL environment variable is not set');
      process.exit(1);
    }

    TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY');
    if (TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY === undefined) {
      console.error('❌ TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY environment variable is not set');
      process.exit(1);
    }

    TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS = getEnv('TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS');
    if (TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS === undefined) {
      console.error('❌ TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS environment variable is not set');
      process.exit(1);
    }
  });

  it('should execute the ERC20 Approval Tool with the Agent Wallet PKP', async () => {
    const erc20ApprovalExecutionResult = await executeVincentTool({
      vincentToolIpfsCid: VincentToolErc20ApprovalMetadata.ipfsCid,
      vincentToolParameters: {
        rpcUrl: TEST_UNISWAP_RPC_URL,
        chainId: 8453, // TODO Replace hardcoded chain id
        pkpEthAddress: TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS,
        spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
        tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
        tokenDecimals: 18,
        tokenAmount: 1,
      },
      vincentAppDelegateePrivateKey: TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY!,
      litSdkDebug: true,
    });

    expect(erc20ApprovalExecutionResult).toBeDefined();

    const parsedResponse = JSON.parse(erc20ApprovalExecutionResult.response as string);

    expect(parsedResponse.policyEvaluationResults).toBeDefined();
    expect(parsedResponse.policyEvaluationResults.allow).toBe(true);
    expect(parsedResponse.policyEvaluationResults.evaluatedPolicies.length).toBe(0);
    expect(parsedResponse.policyEvaluationResults.allowedPolicies).toEqual({});

    expect(parsedResponse.toolExecutionResult).toBeDefined();
    expect(parsedResponse.toolExecutionResult.success).toBe(true);
    expect(parsedResponse.toolExecutionResult.result).toBeDefined();

    // Handle both cases: existing approval or new approval needed
    const result = parsedResponse.toolExecutionResult.result;
    expect(typeof result.existingApprovalSufficient).toBe('boolean');

    if (result.existingApprovalSufficient) {
      expect(result.approvalTxHash).toBeUndefined();
    } else {
      expect(result.approvalTxHash).toBeDefined();
      expect(result.approvalTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const uniswapProvider = new ethers.providers.JsonRpcProvider(TEST_UNISWAP_RPC_URL);
      const approvalTxReceipt = await uniswapProvider.waitForTransaction(result.approvalTxHash);
      expect(approvalTxReceipt.status).toBe(1);
    }

    // Common validations for both cases
    expect(ethers.BigNumber.from(result.approvedAmount).gt(0)).toBe(true);
    expect(result.tokenAddress).toBe('0x4200000000000000000000000000000000000006');
    expect(result.tokenDecimals).toBe(18);
    expect(result.spenderAddress).toBe('0x2626664c2603336E57B271c5C0b26F421741e481');
  });

  // xit('should execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
  //   const BASE_RPC_URL = getEnv('TEST_BASE_RPC_URL')!;
  //   const ETH_RPC_URL = getEnv('TEST_ETH_RPC_URL')!;
  //   const TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY')!;

  //   const uniswapSwapExecutionResult = await executeTool({
  //     toolIpfsCid: VincentToolUniswapSwapMetadata.ipfsCid,
  //     toolParameters: {
  //       pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
  //       ethRpcUrl: ETH_RPC_URL,
  //       rpcUrlForUniswap: BASE_RPC_URL,
  //       chainIdForUniswap: 8453,
  //       tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH
  //       tokenInDecimals: 18,
  //       tokenInAmount: 0.0000077,
  //       tokenOutAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // CBBTC
  //       tokenOutDecimals: 8,
  //     },
  //     delegateePrivateKey: TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY,
  //     debug: true,
  //     capacityCreditTokenId: TEST_CONFIG.capacityCreditInfo!.capacityTokenId!,
  //   });

  //   expect(uniswapSwapExecutionResult).toBeDefined();

  //   const parsedResponse = JSON.parse(uniswapSwapExecutionResult.response as string);

  //   expect(parsedResponse.success).toBeTruthy();

  //   expect(parsedResponse.result).toBeDefined();
  //   expect(parsedResponse.result.swapTxHash).toBeDefined();
  //   expect(parsedResponse.result.spendTxHash).toBeDefined();

  //   const swapTxHash = parsedResponse.result.swapTxHash;
  //   expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

  //   const spendTxHash = parsedResponse.result.spendTxHash;
  //   expect(spendTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

  //   // Verify transactions succeeded
  // const BASE_RPC_URL_FOR_VERIFICATION = getEnv('TEST_BASE_RPC_URL')!;
  // const baseProvider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL_FOR_VERIFICATION);

  //   const swapTxReceipt = await baseProvider.waitForTransaction(swapTxHash);
  //   expect(swapTxReceipt.status).toBe(1);

  //   const spendTxReceipt = await baseProvider.waitForTransaction(spendTxHash);
  //   expect(spendTxReceipt.status).toBe(1);
  // });
});
