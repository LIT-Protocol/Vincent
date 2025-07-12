import { z } from 'zod';

export const toolParamsSchema = z.object({
  rpcUrl: z.string(), // FIXME: This should not be a tool-provided argument
  chainId: z.number(),
  spenderAddress: z.string(),

  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  tokenAmount: z.number().gte(0, 'tokenAmount cannot be a negative number'),
});

export const precheckSuccessSchema = z.object({
  alreadyApproved: z.boolean(),
  currentAllowance: z.string(),
});

export const precheckFailSchema = z.object({
  noNativeTokenBalance: z.boolean(),
});

export const executeSuccessSchema = z.object({
  // Transaction hash if a new approval was created, undefined if existing approval was used
  approvalTxHash: z.string().optional(),
  // The approved amount that is now active (either from existing or new approval)
  approvedAmount: z.string(),
  // The token address that was approved
  tokenAddress: z.string(),
  // The token decimals that was approved
  tokenDecimals: z.number(),
  // The spender address that was approved
  spenderAddress: z.string(),
});

export const executeFailSchema = z.object({
  error: z.string(),
});
