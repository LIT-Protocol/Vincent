import { z } from 'zod';

import { simulateAssetChangeSchema } from './helpers/simulation';
import { addressSchema } from './helpers/schemas';
import { userOpSchema } from './helpers/userOperation';

/**
 * Ability parameters schema - defines the input parameters for the AAVE Smart Account ability
 */
export const abilityParamsSchema = z.object({
  userOp: userOpSchema.describe(
    'User operation to sign and execute. This MUST be a valid UserOperation object as defined in the UserOperation schemas.',
  ),
  entryPointAddress: addressSchema.describe(
    'EntryPoint to use for the simulation. This MUST be one of the EntryPoints returned by the supportedEntryPoints RPC call.',
  ),
  alchemyRpcUrl: z
    .string()
    .regex(/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2\/.+/, { message: 'Invalid Alchemy RPC URL' })
    .url()
    .describe('Alchemy RPC URL for the desired chain. Will be used to simulate the transaction.'),
  serializedZeroDevPermissionAccount: z
    .string()
    .describe(
      'Serialized ZeroDev permission account. AKA Session key. The permitted signer that will sign the userOp.',
    ),
});

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
const baseSuccessSchema = z.object({
  simulationChanges: z
    .array(simulateAssetChangeSchema)
    .describe('Simulated changes user op will make to the blockchain.'),
});
export const precheckSuccessSchema = baseSuccessSchema.extend({
  userOp: userOpSchema.describe('Complete user operation pending signature to execute.'),
});
export const executeSuccessSchema = baseSuccessSchema.extend({
  userOp: userOpSchema.describe(
    'Complete user operation signed and ready to be sent to the blockchain.',
  ),
});
