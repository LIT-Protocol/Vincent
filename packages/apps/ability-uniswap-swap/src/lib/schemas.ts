import { z } from 'zod';

export const abilityParamsSchema = z.object({
  action: z
    .enum(['approve', 'swap', 'approveAndSwap'])
    .describe(
      'Dictates whether to perform an ERC20 approval, a swap, or both using the signed Uniswap quote',
    ),
  rpcUrlForUniswap: z
    .string()
    .describe(
      'An RPC endpoint for any chain that is supported by the @uniswap/sdk-core package. Must work for the chain specified in the signed Uniswap quote.',
    ),
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
  nativeTokenBalance: z.string().describe('The balance of the native token used for gas fees'),
  tokenInAddress: z.string().describe('The address of the input token used for the swap'),
  tokenInBalance: z.string().describe('The balance of the input token used for the swap'),
  currentTokenInAllowanceForSpender: z
    .string()
    .describe('The current allowance of the input token used for the swap'),
  spenderAddress: z.string().describe('The Uniswap router address that will be used for the swap'),
});

export const precheckFailSchema = z.object({
  reason: z.string().describe('The reason the precheck failed'),
  spenderAddress: z
    .string()
    .describe('The Uniswap router address that will be used to spend the ERC20 token')
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
});
