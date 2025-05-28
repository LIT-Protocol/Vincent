import { z } from 'zod';
import {
  asBundledVincentPolicy,
  createVincentTool,
  createVincentToolPolicy,
} from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { Percent } from '@uniswap/sdk-core';
import { createPublicClient, http } from 'viem';

import {
  getPkpInfo,
  getUniswapQuote,
  sendErc20ApprovalTx,
  sendUniswapTx,
  getTokenAmountInUsd,
} from './tool-helpers';
import {
  checkNativeTokenBalance,
  checkUniswapPoolExists,
  checkTokenInBalance,
} from './tool-checks';
import { createPolicyMapFromToolPolicies } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';

export const UniswapSwapToolParamsSchema = z.object({
  ethRpcUrl: z.string(),
  rpcUrlForUniswap: z.string(),
  chainIdForUniswap: z.number(),
  pkpEthAddress: z.string(),

  tokenInAddress: z.string(),
  tokenInDecimals: z.number(),
  tokenInAmount: z.number().refine((val) => val > 0, {
    message: 'tokenInAmount must be greater than 0',
  }),

  tokenOutAddress: z.string(),
  tokenOutDecimals: z.number(),

  poolFee: z.number().optional(),
  slippageTolerance: z.number().optional(),
  swapDeadline: z.number().optional(),
});

export const UniswapSwapToolPrecheckSuccessSchema = z.object({
  allow: z.literal(true),
});

export const UniswapSwapToolPrecheckFailSchema = z.object({
  allow: z.literal(false),
  error: z.string(),
});

export const UniswapSwapToolExecuteSuccessSchema = z.object({
  erc20ApprovalTxHash: z.string(),
  swapTxHash: z.string(),
  spendTxHash: z.string().optional(),
});

export const UniswapSwapToolExecuteFailSchema = z.object({
  error: z.string(),
});

const SpendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema: UniswapSwapToolParamsSchema,
  bundledVincentPolicy: asBundledVincentPolicy(
    SpendingLimitPolicyDef,
    'QmXrs4GKFq4RDEhRiiMZx5hL8xeiKkDxxSdkPazVHsfgsg' as const,
  ),
  toolParameterMappings: {
    pkpEthAddress: 'pkpEthAddress',
    ethRpcUrl: 'ethRpcUrl',
    tokenInAddress: 'tokenAddress',
    tokenInDecimals: 'tokenDecimals',
    tokenInAmount: 'buyAmount',
  },
});

export const UniswapSwapToolDef = createVincentTool({
  // packageName: '@lit-protocol/vincent-tool-uniswap-swap' as const,

  toolParamsSchema: UniswapSwapToolParamsSchema,
  policyMap: createPolicyMapFromToolPolicies([SpendingLimitPolicy] as const),

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,

  executeSuccessSchema: UniswapSwapToolExecuteSuccessSchema,
  executeFailSchema: UniswapSwapToolExecuteFailSchema,

  precheck: async ({ toolParams }, { policiesContext, fail, succeed }) => {
    if (!policiesContext.allow) return fail({ allow: false, error: 'Policy check failed' });

    const {
      pkpEthAddress,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
      poolFee,
    } = toolParams;

    const client = createPublicClient({
      transport: http(rpcUrlForUniswap),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    await checkTokenInBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInAmount: BigInt(tokenInAmount),
    });

    await checkUniswapPoolExists({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress: tokenOutAddress as `0x${string}`,
      tokenOutDecimals,
      poolFee,
    });

    // TODO Check tokenInAddress ERC20 Allowance for Uniswap Router Contract

    return succeed({
      allow: true,
    });
  },
  execute: async ({ toolParams }, { succeed, fail, policiesContext }) => {
    if (!policiesContext.allow) return fail({ error: 'Policy check failed' });

    const {
      pkpEthAddress,
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
      poolFee,
      slippageTolerance,
      swapDeadline,
    } = toolParams;

    const pkpInfo = await getPkpInfo({
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const { swapQuote, uniswapSwapRoute, uniswapTokenIn, uniswapTokenOut } = await getUniswapQuote({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
      poolFee,
    });

    const erc20ApprovalTxHash = await sendErc20ApprovalTx({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      tokenInAmount: BigInt(tokenInAmount),
      tokenInDecimals,
      tokenInAddress: tokenInAddress as `0x${string}`,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      pkpPublicKey: pkpInfo.publicKey,
    });

    const swapTxHash = await sendUniswapTx({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      tokenInDecimals,
      tokenInAmount,
      pkpPublicKey: pkpInfo.publicKey,
      uniswapSwapRoute,
      uniswapTokenIn,
      uniswapTokenOut,
      swapQuote,
      slippageTolerance: new Percent(slippageTolerance ?? 50, 10_000),
      swapDeadline: BigInt(swapDeadline ?? Math.floor(Date.now() / 1000) + 60 * 20),
    });

    let spendTxHash: string | undefined;
    if (policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit']) {
      const tokenInAmountInUsd = await getTokenAmountInUsd({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenInAddress,
        tokenAmount: tokenInAmount,
        tokenDecimals: tokenInDecimals,
      });

      const spendingLimitPolicyContext =
        policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];
      const { appId, maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;

      const commitResult = await spendingLimitPolicyContext.commit({
        appId,
        amountSpentUsd: Number(tokenInAmountInUsd),
        maxSpendingLimitInUsd: Number(maxSpendingLimitInUsd),
        pkpEthAddress,
        pkpPubKey: pkpInfo.publicKey,
      });

      if (commitResult.allow) {
        spendTxHash = commitResult.result.spendTxHash;
      } else {
        return fail({
          error:
            commitResult.error ?? 'Unknown error occurred while committing spending limit policy',
        });
      }
      console.log(
        `Committed spending limit policy for transaction: ${spendTxHash} (UniswapSwapToolExecute)`,
      );
    }

    return succeed({
      erc20ApprovalTxHash,
      swapTxHash,
      spendTxHash,
    });
  },
});
