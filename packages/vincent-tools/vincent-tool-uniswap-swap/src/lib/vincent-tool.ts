import { z } from 'zod';
import {
  asBundledVincentPolicy,
  createVincentTool,
  createVincentToolPolicy,
} from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import { createPublicClient, http } from 'viem';
import { createPolicyMapFromToolPolicies } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';

import { getPkpInfo, getTokenAmountInUsd, sendUniswapTx } from './tool-helpers';
import {
  checkNativeTokenBalance,
  checkUniswapPoolExists,
  checkTokenInBalance,
  checkErc20Allowance,
} from './tool-checks';

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
    'QmViYqwvjSyDqkqehbxpB7hM6GrVUNhfmm48UW1bHF5dy6' as const,
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
  policyMap: createPolicyMapFromToolPolicies([SpendingLimitPolicy]),

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
    } = toolParams;

    const client = createPublicClient({
      transport: http(rpcUrlForUniswap),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const uniswapRouterAddress = CHAIN_TO_ADDRESSES_MAP[
      chainIdForUniswap as keyof typeof CHAIN_TO_ADDRESSES_MAP
    ].quoterAddress as `0x${string}`;
    if (uniswapRouterAddress === undefined) {
      return fail({
        allow: false,
        error: `Uniswap router address not found for chainId ${chainIdForUniswap} (UniswapSwapToolPrecheck)`,
      });
    }

    await checkErc20Allowance({
      client,
      tokenAddress: tokenInAddress as `0x${string}`,
      owner: pkpEthAddress as `0x${string}`,
      spender: uniswapRouterAddress,
      tokenAmount: BigInt(tokenInAmount),
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
    });

    return succeed({
      allow: true,
    });
  },
  execute: async ({ toolParams }, { succeed, fail, policiesContext }) => {
    if (!policiesContext.allow) return fail({ error: 'Policy check failed' });

    console.log('Executing UniswapSwapTool');

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
    } = toolParams;

    const pkpInfo = await getPkpInfo(pkpEthAddress);

    const swapTxHash = await sendUniswapTx({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      pkpPublicKey: pkpInfo.publicKey,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenOutAddress: tokenOutAddress as `0x${string}`,
      tokenInDecimals,
      tokenOutDecimals,
      tokenInAmount,
    });

    let spendTxHash: string | undefined;
    const spendingLimitPolicyContext =
      policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];
    if (spendingLimitPolicyContext !== undefined) {
      const tokenInAmountInUsd = await getTokenAmountInUsd({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenInAddress,
        tokenAmount: tokenInAmount,
        tokenDecimals: tokenInDecimals,
      });

      console.log('Spending limit policy context', spendingLimitPolicyContext);
      console.log('Spending limit policy context result', spendingLimitPolicyContext.result);

      const { appId, maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;
      const commitResult = await spendingLimitPolicyContext.commit({
        appId,
        amountSpentUsd: tokenInAmountInUsd.toNumber(),
        maxSpendingLimitInUsd,
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
      swapTxHash,
      spendTxHash,
    });
  },
});
