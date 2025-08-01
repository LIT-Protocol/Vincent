import { z } from 'zod';

export const abilityParamsSchema = z.object({
  ethRpcUrl: z
    .string()
    .describe(
      'An Ethereum Mainnet RPC Endpoint. This is used to check USD <> ETH prices via Chainlink.',
    ),
  rpcUrlForUniswap: z
    .string()
    .describe(
      'An RPC endpoint for any chain that is supported by the Uniswap. Must work for the chain specified in chainIdForUniswap.',
    ),
  chainIdForUniswap: z
    .number()
    .describe('The chain ID to execute the transaction on. For example: 8453 for Base.'),
  tokenAddress: z
    .string()
    .describe(
      'ERC20 Token address to spend/sell. For example 0x4200000000000000000000000000000000000006 for WETH on Base.',
    ),
  tokenDecimals: z
    .number()
    .describe('ERC20 Token to spend/sell decimals. For example 18 for WETH on Base.'),
  buyAmount: z
    .number()
    .describe('Amount of token to spend/sell. For example 0.00001 for 0.00001 WETH.'),
});

export const userParamsSchema = z.object({
  maxDailySpendingLimitInUsdCents: z
    .bigint()
    .describe('The maximum daily spending limit in USD cents, as a BigInt.'),
});

export const precheckAllowResultSchema = z.object({
  maxSpendingLimitInUsd: z.number().describe("The user's daily spending limit in USD."),
  buyAmountInUsd: z.number().describe('The value of the tokens to be spent, in USD.'),
});

export const precheckDenyResultSchema = z.object({
  reason: z
    .literal('Attempted buy amount exceeds daily limit')
    .describe('The reason for denying the precheck.'),
  maxSpendingLimitInUsd: z.number().describe("The user's daily spending limit in USD."),
  buyAmountInUsd: z.number().describe('The value of the tokens to be spent, in USD.'),
});

export const evalAllowResultSchema = z.object({
  maxSpendingLimitInUsd: z.number().describe("The user's daily spending limit in USD."),
  buyAmountInUsd: z.number().describe('The value of the tokens to be spent, in USD.'),
});

export const evalDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the evaluation.'),
  maxSpendingLimitInUsd: z.number().optional().describe("The user's daily spending limit in USD."),
  buyAmountInUsd: z.number().optional().describe('The value of the tokens to be spent, in USD.'),
});

export const commitParamsSchema = z.object({
  amountSpentUsd: z.number().describe('The amount spent for this transaction, in USD.'),
  maxSpendingLimitInUsd: z.number().describe("The user's daily spending limit in USD."),
});

export const commitAllowResultSchema = z.object({
  spendTxHash: z.string().describe('The hash of the transaction recording the amount spent.'),
});

export const commitDenyResultSchema = z.object({
  error: z.string().describe('A string containing the error message if the commit failed.'),
});
