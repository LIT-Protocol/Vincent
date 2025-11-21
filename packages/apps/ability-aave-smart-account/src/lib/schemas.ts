import { entryPoint07Address } from 'viem/account-abstraction';
import { z } from 'zod';

import { simulateAssetChangeSchema } from './helpers/simulation';
import { addressSchema, hexSchema } from './helpers/schemas';
import { transactionSchema } from './helpers/transaction';
import { userOpSchema } from './helpers/userOperation';

/**
 * Ability parameters schema - defines the input parameters for the AAVE Smart Account ability
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
});

export const transactionAbilityParamsSchema = z.object({
  alchemyRpcUrl: alchemyRpcUrlSchema,
  transaction: transactionSchema.describe(
    'EOA transaction to simulate and validate. Only transactions targeting the supported Aave pool or approved ERC20 approvals will be accepted.',
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
    .describe('Simulated changes user op will make to the blockchain.'),
});
export const executeSuccessSchema = precheckSuccessSchema.extend({
  signature: hexSchema.describe('ECDSA signature over the received user operation or transaction.'),
});
