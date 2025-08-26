import { SchemaValidationError } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';
import { bundledVincentPolicy as spendingLimitBundledPolicy } from '@lit-protocol/vincent-policy-spending-limit';

export const abilityParamsSchema = z.object({
  ethRpcUrl: z
    .string()
    .describe(
      'An Ethereum Mainnet RPC Endpoint. This is used to check USD <> ETH prices via Chainlink.',
    ),
  rpcUrlForUniswap: z
    .string()
    .describe(
      'An RPC endpoint for any chain that is supported by the @uniswap/sdk-core package. Must work for the chain specified in chainIdForUniswap.',
    ),
  chainIdForUniswap: z
    .number()
    .describe('The chain ID to execute the transaction on. For example: 8453 for Base.'),

  tokenInAddress: z
    .string()
    .describe(
      'ERC20 Token address to sell. For example 0x4200000000000000000000000000000000000006 for WETH on Base.',
    ),
  tokenInDecimals: z
    .number()
    .describe('ERC20 Token to sell decimals. For example 18 for WETH on Base.'),
  tokenInAmount: z
    .number()
    .refine((val) => val > 0, {
      message: 'tokenInAmount must be greater than 0',
    })
    .describe(
      'Amount of token to sell. For example 0.00001 for 0.00001 WETH. Must be greater than 0.',
    ),

  tokenOutAddress: z
    .string()
    .describe(
      'ERC20 Token address to buy. For example 0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C for SPX600 on Base.',
    ),
  tokenOutDecimals: z
    .number()
    .describe('ERC20 Token to buy decimals. For example 18 for WETH on Base.'),

  route: z
    .object({
      to: z.string().describe('The router contract address'),
      calldata: z.string().describe('The encoded transaction data'),
      estimatedGasUsed: z.string().describe('The estimated gas usage for the swap'),
    })
    .describe('Pre-computed Uniswap route data from precheck')
    .nullable(),
});

export const precheckSuccessSchema = z.object({
  route: z
    .object({
      to: z.string().describe('The router contract address'),
      calldata: z.string().describe('The encoded transaction data'),
      estimatedGasUsed: z.string().describe('The estimated gas usage for the swap'),
    })
    .describe('The pre-computed Uniswap route data')
    .nullable(),
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

const spendingLimitCommitFailSchema = spendingLimitBundledPolicy.vincentPolicy
  .commitDenyResultSchema
  ? spendingLimitBundledPolicy.vincentPolicy.commitDenyResultSchema
  : z.undefined().optional();

export const executeFailSchema = z.object({
  reason: z
    .string()
    .optional()
    .describe('The reason for failing the execution in cases where we identified the reason.'),
  spendingLimitCommitFail: z
    .object({
      runtimeError: z.string().optional(),
      schemaValidationError: z.custom<SchemaValidationError>().optional(),
      structuredCommitFailureReason: spendingLimitCommitFailSchema.optional(),
    })
    .optional()
    .describe('The commit failure result'),
});

export const executeSuccessSchema = z.object({
  swapTxHash: z.string().describe('The hash of the swapping transaction on uniswap'),
  spendTxHash: z
    .string()
    .optional()
    .describe(
      'The hash of the transaction recording the amount spent. Necessary for spending limit enforcement by @lit-protocol/vincent-policy-spending-limit policy',
    ),
});
