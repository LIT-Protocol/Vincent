import { z } from 'zod';

export const abilityParamsSchema = z.object({
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
});

export const precheckFailSchema = z.object({
  reason: z
    .string()
    .optional()
    .describe('The reason for failing the execution in cases where we identified the reason.'),
  erc20SpenderAddress: z
    .string()
    .optional()
    .describe('The Uniswap router address that will be used to spend the ERC20 token'),
});

export const executeFailSchema = z.object({
  reason: z
    .string()
    .optional()
    .describe('The reason for failing the execution in cases where we identified the reason.'),
});

export const executeSuccessSchema = z.object({
  swapTxHash: z.string().describe('The hash of the swapping transaction on uniswap'),
});
