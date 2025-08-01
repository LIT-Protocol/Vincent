import { z } from 'zod';

/**
 * AAVE operation types
 */
export enum AaveOperation {
  SUPPLY = 'supply',
  WITHDRAW = 'withdraw',
  BORROW = 'borrow',
  REPAY = 'repay',
}

/**
 * Supported chains for validation
 */
const SUPPORTED_CHAINS = [
  // Mainnets
  'ethereum',
  'polygon',
  'avalanche',
  'arbitrum',
  'optimism',
  'base',
  'fantom',
  'bnb',
  'gnosis',
  'scroll',
  'metis',
  'linea',
  'zksync',
  // Testnets
  'sepolia',
  'basesepolia',
  'arbitrumsepolia',
  'optimismsepolia',
  'avalanchefuji',
  'scrollsepolia',
] as const;

/**
 * Ability parameters schema - defines the input parameters for the AAVE ability
 */
export const abilityParamsSchema = z.object({
  operation: z
    .nativeEnum(AaveOperation)
    .describe('The AAVE operation to perform (supply, withdraw, borrow, repay)'),
  asset: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address')
    .describe('The token contract address for the operation'),
  amount: z
    .string()
    .regex(/^\d*\.?\d+$/, 'Invalid amount format')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0')
    .describe('The amount of tokens to use in the operation, as a string'),
  interestRateMode: z
    .number()
    .int()
    .min(1)
    .max(2)
    .optional()
    .describe('Interest rate mode: 1 for Stable, 2 for Variable (only for borrow operations)'),
  onBehalfOf: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address')
    .optional()
    .describe('The address that will receive the aTokens (optional)'),
  chain: z
    .string()
    .refine(
      (val) => SUPPORTED_CHAINS.includes(val.toLowerCase() as any),
      `Chain must be one of: ${SUPPORTED_CHAINS.join(', ')}`,
    )
    .describe('The blockchain network to perform the operation on'),
  rpcUrl: z.string().optional().describe('Custom RPC URL (optional, uses default if not provided)'),
});

/**
 * Precheck success result schema
 */
export const precheckSuccessSchema = z.object({
  operationValid: z.boolean().describe('Whether the requested operation is valid'),
  assetValid: z.boolean().describe('Whether the specified asset is valid for the operation'),
  amountValid: z.boolean().describe('Whether the specified amount is valid'),
  userBalance: z.string().optional().describe("The user's current balance of the specified asset"),
  allowance: z.string().optional().describe('The current allowance approved for the AAVE contract'),
  borrowCapacity: z.string().optional().describe("The user's current borrow capacity in USD"),
  estimatedGas: z.number().optional().describe('Estimated gas cost for the operation'),
  availableMarkets: z.record(z.string()).optional().describe('Available markets and their status'),
  supportedChains: z.array(z.string()).optional().describe('List of supported blockchain networks'),
});

/**
 * Precheck failure result schema
 */
export const precheckFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the precheck failed.'),
});

/**
 * Execute success result schema
 */
export const executeSuccessSchema = z.object({
  txHash: z.string().describe('The transaction hash of the executed operation'),
  operation: z.nativeEnum(AaveOperation).describe('The type of AAVE operation that was executed'),
  asset: z.string().describe('The token address involved in the operation'),
  amount: z.string().describe('The amount of tokens involved in the operation'),
  timestamp: z.number().describe('The Unix timestamp when the operation was executed'),
  interestRateMode: z
    .number()
    .optional()
    .describe('The interest rate mode used (1 for Stable, 2 for Variable)'),
});

/**
 * Execute failure result schema
 */
export const executeFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the execution failed.'),
});
