import { z } from 'zod';
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';

import { UniswapSwapToolPrecheck } from './vincent-tool-precheck';
import { UniswapSwapToolExecute } from './vincent-tool-execute';

export const UniswapSwapToolParamsSchema = z.object({
  ethRpcUrl: z.string(),
  pkpEthAddress: z.string(),

  tokenInAddress: z.string(),
  tokenInDecimals: z.number(),
  tokenInAmount: z.bigint().refine((val) => val > 0n, {
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
  policyDef: SpendingLimitPolicyDef,
  toolParameterMappings: {
    pkpEthAddress: 'pkpEthAddress',
    ethRpcUrl: 'ethRpcUrl',
    tokenInAddress: 'tokenAddress',
    tokenInDecimals: 'tokenDecimals',
    tokenInAmount: 'buyAmount',
  },
});

export const UniswapSwapToolDef = createVincentTool({
  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,
  executeSuccessSchema: UniswapSwapToolExecuteSuccessSchema,
  executeFailSchema: UniswapSwapToolExecuteFailSchema,

  precheck: UniswapSwapToolPrecheck,
  execute: UniswapSwapToolExecute,
});
