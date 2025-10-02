import { z } from 'zod';

export const abilityParamsSchema = z.object({
  rpcUrl: z
    .string()
    .describe('The RPC URL to use for the transaction. Must support the chainId specified.'), // FIXME: This should not be an ability-provided argument
  signedUniswapQuote: z
    .object({
      quote: z.object({
        chainId: z.number().describe('The chain ID the swap was generated for.'),
        to: z.string().describe('The router contract address'),
        recipient: z.string().describe('The address of the recipient of the swap'),
        value: z.string().describe('The value to send with the transaction'),
        calldata: z.string().describe('The encoded transaction data'),
        quote: z.string().describe('Expected output amount as decimal string'),
        blockNumber: z.string().describe('Block number when quote was generated'),
        tokenIn: z.string().describe('Input token address'),
        amountIn: z.string().describe('Input amount as decimal string'),
        tokenInDecimals: z.number().describe('Input token decimals'),
        tokenOut: z.string().describe('Output token address'),
        amountOut: z.string().describe('Output amount as decimal string'),
        tokenOutDecimals: z.number().describe('Output token decimals'),
        timestamp: z.number().describe('Timestamp when quote was generated'),
      }),
      signature: z.string().describe('The signature of the Uniswap quote'),
    })
    .describe('Signed Uniswap quote from Prepare Lit Action'),
  gasBufferPercentage: z
    .number()
    .optional()
    .describe('Percent added to estimated gas limit (default 50).'),
  baseFeePerGasBufferPercentage: z
    .number()
    .optional()
    .describe('Percent added to baseFeePerGas when computing maxFeePerGas (default 0).'),
  alchemyGasSponsor: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use Alchemy gas sponsorship for the transaction.'),
  alchemyGasSponsorApiKey: z
    .string()
    .optional()
    .describe('The API key for Alchemy gas sponsorship.'),
  alchemyGasSponsorPolicyId: z
    .string()
    .optional()
    .describe('The policy ID for Alchemy gas sponsorship.'),
});

export const precheckSuccessSchema = z.object({
  tokenAddress: z
    .string()
    .describe('The address of the input token for the swap for the Uniswap router spender'),
  spenderAddress: z
    .string()
    .describe('The Uniswap router address that will be used to spend the ERC20 token'),
  currentAllowance: z
    .string()
    .describe(
      'The current allowance of the input token used for the swap for the Uniswap router spender',
    ),
  requiredAllowance: z
    .string()
    .describe(
      'The required allowance of the input token used for the swap for the Uniswap router spender',
    ),
});

export const precheckFailSchema = z.object({
  reason: z.string().describe('The reason for failing the precheck'),
  spenderAddress: z
    .string()
    .optional()
    .describe('The Uniswap router address that will be used to spend the ERC20 token')
    .optional(),
  tokenAddress: z
    .string()
    .optional()
    .describe('The address of the input token for the swap')
    .optional(),
  requiredAllowance: z
    .string()
    .optional()
    .describe(
      'The required allowance of the input token used for the swap for the Uniswap router spender',
    )
    .optional(),
  currentAllowance: z
    .string()
    .optional()
    .describe(
      'The current allowance of the input token used for the swap for the Uniswap router spender',
    )
    .optional(),
});

export const executeSuccessSchema = z.object({
  approvalTxHash: z
    .string()
    .optional()
    .describe(
      'Transaction hash if a new approval was created, undefined if existing approval was used',
    ),
  approvedAmount: z
    .string()
    .describe('The approved amount that is now active (either from existing or new approval)'),
  tokenAddress: z.string().describe('The token address that was approved'),
  spenderAddress: z.string().describe('The spender address that was approved'),
});

export const executeFailSchema = z.object({
  reason: z
    .string()
    .describe('The reason for failing the execution in cases where we identified the reason.'),
});
