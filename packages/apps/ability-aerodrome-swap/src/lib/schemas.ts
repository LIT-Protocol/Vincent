import { z } from 'zod';

export const DEFAULT_AERODROME_SWAP_SLIPPAGE = 0.005;

export const abilityParamsSchema = z.object({
  action: z
    .enum(['approve', 'swap'])
    .describe('Dictates whether to perform an ERC20 approval or a swap'),
  rpcUrl: z
    .string()
    .describe(
      'An RPC endpoint for Base mainnet, used to check balances, allowances, and to send approval and swap transactions',
    ),
  tokenInAddress: z.string().describe('The address of the token to swap from'),
  tokenOutAddress: z.string().describe('The address of the token to swap to'),
  amountIn: z
    .string()
    .describe(
      'The amount to swap in the smallest unit (Example: 2123456 for 2.123456 USDC (6 decimals), or 10000000000000000 for 0.01 WETH (18 decimals))',
    ),
  slippage: z
    .number()
    .min(0)
    .max(1)
    .default(DEFAULT_AERODROME_SWAP_SLIPPAGE)
    .optional()
    .describe('Slippage tolerance as decimal (e.g., 0.005 for 0.5%, default 0.5%)'),
  gasBufferPercentage: z
    .number()
    .optional()
    .describe('Percent added to estimated gas limit (default 50)'),
  baseFeePerGasBufferPercentage: z
    .number()
    .optional()
    .describe('Percent added to baseFeePerGas when computing maxFeePerGas (default 0)'),
  alchemyGasSponsor: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use Alchemy gas sponsorship for the transaction'),
  alchemyGasSponsorApiKey: z
    .string()
    .optional()
    .describe('The API key for Alchemy gas sponsorship'),
  alchemyGasSponsorPolicyId: z
    .string()
    .optional()
    .describe('The policy ID for Alchemy gas sponsorship'),
});

export const precheckSuccessSchema = z.object({
  nativeTokenBalance: z
    .string()
    .describe(
      "The balance of the Vincent delegator's native token in the smallest unit used for gas fees if alchemyGasSponsor is not enabled",
    )
    .optional(),
  tokenInAddress: z
    .string()
    .describe('The address of the input token used for the swap')
    .optional(),
  tokenInBalance: z
    .string()
    .describe(
      "The balance of the Vincent delegator's input token in the smallest unit used for the swap",
    )
    .optional(),
  currentTokenInAllowanceForSpender: z
    .string()
    .describe(
      "The current allowance of the Vincent delegator's input token in the smallest unit used for the swap",
    ),
  spenderAddress: z
    .string()
    .describe('The Aerodrome Universal Router address that will be used for the swap'),
  requiredTokenInAllowance: z
    .string()
    .describe(
      "The required allowance of the Vincent delegator's input token in the smallest unit for the swap for the ERC20 spender (Aerodrome Universal Router address)",
    )
    .optional(),
  quote: z
    .object({
      tokenInAmount: z.string().describe('The amount of the input token for the swap'),
      tokenOutAmount: z.string().describe('The amount of the output token quoted for the swap'),
      priceImpact: z.string().describe('The price impact of the swap'),
    })
    .optional(),
});

export const precheckFailSchema = z.object({
  reason: z.string().describe('The reason the precheck failed'),
  spenderAddress: z
    .string()
    .describe('The Aerodrome router address that will be used to spend the ERC20 token')
    .optional(),
  tokenAddress: z.string().describe('The address of the input token for the swap').optional(),
  requiredTokenAmount: z
    .string()
    .describe('The required amount of the input token in the smallest unit for the swap')
    .optional(),
  tokenBalance: z
    .string()
    .describe(
      "The balance of the Vincent delegator's input token in the smallest unit used for the swap",
    )
    .optional(),
  currentAllowance: z
    .string()
    .describe(
      "The current allowance of the Vincent delegator's input token in the smallest unit used for the swap for the ERC20 spender (Aerodrome Universal Router address)",
    )
    .optional(),
  requiredAllowance: z
    .string()
    .describe(
      "The required allowance of the Vincent delegator's input token in the smallest unit used for the swap for the ERC20 spender (Aerodrome Universal Router address)",
    )
    .optional(),
});

export const executeFailSchema = z.object({
  reason: z.string().optional().describe('The reason the execution failed'),
});

export const executeSuccessSchema = z.object({
  swapTxHash: z.string().describe('The hash of the swapping transaction on Aerodrome').optional(),
  swapTxUserOperationHash: z
    .string()
    .optional()
    .describe('The hash of the user operation that was executed'),
  approvalTxHash: z
    .string()
    .optional()
    .describe(
      'Transaction hash if a new approval was created, undefined if existing approval was used',
    ),
  approvalTxUserOperationHash: z
    .string()
    .optional()
    .describe('The hash of the user operation that was executed'),
  currentAllowance: z
    .string()
    .describe(
      "The current allowance of the Vincent delegator's input token in the smallest unit used for the swap for the ERC20 spender (Aerodrome Universal Router address)",
    )
    .optional(),
  requiredAllowance: z
    .string()
    .describe(
      "The required allowance of the Vincent delegator's input token in the smallest unit used for the swap for the ERC20 spender (Aerodrome Universal Router address)",
    )
    .optional(),
});
