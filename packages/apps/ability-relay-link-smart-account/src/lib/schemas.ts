import { entryPoint07Address } from 'viem/account-abstraction';
import { z } from 'zod';

import { simulateAssetChangeSchema } from './helpers/simulation';
import { addressSchema, hexSchema } from './helpers/schemas';
import { userOpSchema } from './helpers/userOperation';

/**
 * Relay.link transaction data schema - matches the exact format from their API
 * https://docs.relay.link/references/api/get-quote
 */
export const relayLinkTransactionSchema = z.object({
  from: z.string().describe('Sender address'),
  to: z.string().describe('Recipient address'),
  data: z.string().describe('Transaction calldata'),
  value: z.string().describe('Value to send (in wei as decimal string)'),
  chainId: z.number().describe('Chain ID'),
  gas: z.string().optional().describe('Gas limit (decimal string)'),
  maxFeePerGas: z.string().optional().describe('Max fee per gas (decimal string)'),
  maxPriorityFeePerGas: z.string().optional().describe('Max priority fee per gas (decimal string)'),
  gasPrice: z.string().optional().describe('Gas price for legacy transactions (decimal string)'),
});

/**
 * Ability parameters schema - defines the input parameters for the Relay.link Smart Account ability
 */
const alchemyRpcUrlSchema = z
  .string()
  .regex(/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2\/.+/, { message: 'Invalid Alchemy RPC URL' })
  .url()
  .describe('Alchemy RPC URL for the desired chain. Will be used to simulate the transaction.');

export const userOpAbilityParamsSchema = z.object({
  userOp: userOpSchema.describe(
    'User operation to sign and execute. This MUST be a valid UserOperation object as defined in the UserOperation schemas.',
  ),
  entryPointAddress: addressSchema
    .optional()
    .default(entryPoint07Address)
    .describe(
      'EntryPoint to use for the simulation. Currently only v0.7 is supported. Defaults to standard v0.7 entryPoint address.',
    ),
  alchemyRpcUrl: alchemyRpcUrlSchema,
  relayLinkApiKey: z.string().optional().describe('Optional Relay.link API key for validation'),
});

export const transactionAbilityParamsSchema = z.object({
  alchemyRpcUrl: alchemyRpcUrlSchema,
  transaction: relayLinkTransactionSchema.describe(
    'Relay.link transaction from their API quote response. Will be automatically converted to standard format.',
  ),
  relayLinkApiKey: z.string().optional().describe('Optional Relay.link API key for validation'),
  allowedTargets: z
    .array(z.string())
    .optional()
    .describe(
      'Additional allowed contract addresses for V2 protocol depositories or dynamic addresses from the quote response',
    ),
});

export const abilityParamsSchema = z.union([
  userOpAbilityParamsSchema,
  transactionAbilityParamsSchema,
]);

export type AbilityParams = z.infer<typeof abilityParamsSchema>;
export type UserOpAbilityParams = z.infer<typeof userOpAbilityParamsSchema>;
export type TransactionAbilityParams = z.infer<typeof transactionAbilityParamsSchema>;

/**
 * Failure result schema
 */
const baseFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the precheck failed.'),
});
export const precheckFailSchema = baseFailSchema;
export const executeFailSchema = baseFailSchema;

/**
 * Success result schema
 */
export const precheckSuccessSchema = z.object({
  simulationChanges: z
    .array(simulateAssetChangeSchema)
    .optional()
    .describe('Simulated changes user op will make to the blockchain.'),
});
export const executeSuccessSchema = precheckSuccessSchema.extend({
  signature: hexSchema.describe('ECDSA signature over the received user operation or transaction.'),
});
