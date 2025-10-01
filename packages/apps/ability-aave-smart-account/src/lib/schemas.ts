import { z } from 'zod';

import { userOpSchema } from './helpers/userOperation';
import { simulateAssetChangeSchema } from './helpers/simulation';

/**
 * Ability parameters schema - defines the input parameters for the AAVE Smart Account ability
 */
export const abilityParamsSchema = z.object({
  userOp: userOpSchema.describe(
    'User operation to sign and execute. This MUST be a valid UserOperation object as defined in the UserOperation schemas.',
  ),
  entryPointAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .describe(
      'EntryPoint to use for the simulation. This MUST be one of the EntryPoints returned by the supportedEntryPoints RPC call.',
    ),
  rpcUrl: z.string().optional().describe('Custom RPC URL (optional, uses default if not provided)'),
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
