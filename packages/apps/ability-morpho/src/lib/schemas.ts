import { z } from 'zod';

/**
 * Morpho operation types for both Vaults and Markets
 */
export enum MorphoOperation {
  // Vault operations
  VAULT_DEPOSIT = 'vault_deposit',
  VAULT_WITHDRAW = 'vault_withdraw',
  VAULT_REDEEM = 'vault_redeem',
  // Market operations
  MARKET_SUPPLY = 'market_supply',
  MARKET_WITHDRAW_COLLATERAL = 'market_withdrawCollateral',
}

/**
 * Ability parameters schema - defines the input parameters for the Morpho ability
 */
export const abilityParamsSchema = z.object({
  operation: z
    .nativeEnum(MorphoOperation)
    .describe(
      'The Morpho operation to perform (vault_deposit, vault_withdraw, vault_redeem, market_supply, market_withdrawCollateral)',
    ),
  contractAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid vault or market contract address')
    .describe('The address of the Morpho vault or market contract'),
  marketId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid market ID')
    .optional()
    .describe('The market ID (required for market operations)'),
  amount: z
    .string()
    .regex(/^\d*\.?\d+$/, 'Invalid amount format')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0')
    .describe('The amount of tokens to deposit/withdraw/redeem, as a string'),
  onBehalfOf: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address')
    .optional()
    .describe('The address that will receive the vault shares (optional)'),
  chain: z.string().describe('The blockchain network where the vault is deployed'),
  rpcUrl: z.string().optional().describe('Custom RPC URL (optional, uses default if not provided)'),
  // Gas sponsorship parameters for EIP-7702
  alchemyGasSponsor: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to use Alchemy's gas sponsorship (EIP-7702)"),
  alchemyGasSponsorApiKey: z
    .string()
    .optional()
    .describe('Alchemy API key for gas sponsorship (required if alchemyGasSponsor is true)'),
  alchemyGasSponsorPolicyId: z
    .string()
    .optional()
    .describe('Alchemy gas policy ID for sponsorship (required if alchemyGasSponsor is true)'),
});

/**
 * Precheck success result schema
 */
export const precheckSuccessSchema = z.object({
  operationValid: z.boolean().describe('Whether the requested operation is valid'),
  contractValid: z
    .boolean()
    .describe('Whether the specified vault or market contract address is valid'),
  amountValid: z.boolean().describe('Whether the specified amount is valid'),
  userBalance: z.string().optional().describe("The user's current balance of the underlying asset"),
  allowance: z.string().optional().describe('The current allowance approved for the contract'),
  vaultShares: z
    .string()
    .optional()
    .describe("The user's current balance of vault shares (for vault operations)"),
  collateralBalance: z
    .string()
    .optional()
    .describe("The user's collateral balance in the market (for market operations)"),
  estimatedGas: z.number().optional().describe('Estimated gas cost for the operation'),
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
  operation: z
    .nativeEnum(MorphoOperation)
    .describe('The type of Morpho operation that was executed'),
  contractAddress: z
    .string()
    .describe('The vault or market address of the contract involved in the operation'),
  marketId: z.string().optional().describe('The market ID for market operations'),
  amount: z.string().describe('The amount of tokens involved in the operation'),
  timestamp: z.number().describe('The Unix timestamp when the operation was executed'),
});

/**
 * Execute failure result schema
 */
export const executeFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the execution failed.'),
});
