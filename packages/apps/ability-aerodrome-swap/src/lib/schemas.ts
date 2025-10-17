import { z } from 'zod';

export const abilityParamsSchema = z.object({
  action: z
    .enum(['approve', 'swap'])
    .describe('Dictates whether to perform an ERC20 approval or a swap using the sugar-sdk'),
  rpcUrl: z.string().describe('An RPC endpoint for Base chain (Aerodrome only operates on Base)'),
  tokenInAddress: z.string().describe('The address of the token to swap from'),
  tokenOutAddress: z.string().describe('The address of the token to swap to'),
  amountIn: z.string().describe('The amount to swap in smallest unit (wei) as a string'),
  slippage: z
    .number()
    .min(0)
    .max(1)
    .default(0.005)
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
      'The balance of the native token used for gas fees if alchemyGasSponsor is not enabled',
    )
    .optional(),
  tokenInAddress: z
    .string()
    .describe('The address of the input token used for the swap')
    .optional(),
  tokenInBalance: z
    .string()
    .describe('The balance of the input token used for the swap')
    .optional(),
  currentTokenInAllowanceForSpender: z
    .string()
    .describe('The current allowance of the input token used for the swap'),
  spenderAddress: z.string().describe('The Uniswap router address that will be used for the swap'),
  requiredTokenInAllowance: z
    .string()
    .describe('The required allowance of the input token for the swap for the ERC20 spender')
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
    .describe('The required amount of the input token for the swap')
    .optional(),
  tokenBalance: z.string().describe('The balance of the input token used for the swap').optional(),
  currentAllowance: z
    .string()
    .describe('The current allowance of the input token used for the swap for the ERC20 spender')
    .optional(),
  requiredAllowance: z
    .string()
    .describe('The required allowance of the input token used for the swap for the ERC20 spender')
    .optional(),
});

export const executeFailSchema = z.object({
  reason: z.string().optional().describe('The reason the execution failed'),
});

export const executeSuccessSchema = z.object({
  swapTxHash: z.string().describe('The hash of the swapping transaction on uniswap').optional(),
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
    .describe('The current allowance of the input token used for the swap for the ERC20 spender')
    .optional(),
  requiredAllowance: z
    .string()
    .describe('The required allowance of the input token used for the swap for the ERC20 spender')
    .optional(),
});
