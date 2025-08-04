import { z } from 'zod';

export const abilityParamsSchema = z.object({
  rpcUrl: z
    .string()
    .describe('The RPC URL to use for the transaction. Must support the chainId specified.'), // FIXME: This should not be an ability-provided argument
  chainId: z
    .number()
    .describe('The chain ID to execute the transaction on. For example: 8453 for Base.'),
  spenderAddress: z
    .string()
    .describe(
      'The spender address to approve. For example 0x2626664c2603336E57B271c5C0b26F421741e481 for the Uniswap v3 Swap Router contract on Base.',
    ),

  tokenAddress: z
    .string()
    .describe(
      'ERC20 Token address to approve. For example 0x4200000000000000000000000000000000000006 for WETH on Base.',
    ),
  tokenDecimals: z
    .number()
    .describe('ERC20 Token to approve decimals. For example 18 for WETH on Base.'),
  tokenAmount: z
    .number()
    .gte(0, 'tokenAmount cannot be a negative number')
    .describe('Amount of tokenIn to approve. For example 0.00001 for 0.00001 WETH.'),
});

export const precheckSuccessSchema = z.object({
  alreadyApproved: z
    .boolean()
    .describe('Boolean indicating if the spender already has sufficient allowance.'),
  currentAllowance: z
    .string()
    .describe(
      'The current allowance the spender has for the token, as a string representation of a number.',
    ),
});

export const precheckFailSchema = z.object({
  noNativeTokenBalance: z
    .boolean()
    .describe('Boolean indicating if the user has enough native token to pay for gas fees.'),
});

export const executeSuccessSchema = z.object({
  // Transaction hash if a new approval was created, undefined if existing approval was used
  approvalTxHash: z
    .string()
    .optional()
    .describe(
      'Transaction hash if a new approval was created, undefined if existing approval was used',
    ),
  // The approved amount that is now active (either from existing or new approval)
  approvedAmount: z
    .string()
    .describe('The approved amount that is now active (either from existing or new approval)'),
  // The token address that was approved
  tokenAddress: z.string().describe('The token address that was approved'),
  // The token decimals that was approved
  tokenDecimals: z.number().describe('The token decimals that was approved'),
  // The spender address that was approved
  spenderAddress: z.string().describe('The spender address that was approved'),
});

export const executeFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the execution failed.'),
});
