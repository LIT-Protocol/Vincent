import { z } from 'zod';

export const abilityParamsSchema = z.object({
  serializedTransaction: z
    .string()
    .describe('The base64 encoded serialized Solana transaction to be evaluated'),
  versionedTransaction: z
    .boolean()
    .optional()
    .describe('Whether this is a versioned transaction (v0) or legacy transaction'),
});

export const userParamsSchema = z.object({
  whitelist: z
    .array(z.string())
    .describe('Array of whitelisted Solana program IDs (base58 encoded public keys)'),
});

export const precheckAllowResultSchema = z.object({
  programIds: z
    .array(z.string())
    .describe('The program IDs found in the transaction that were allowed'),
});

export const precheckDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the precheck.'),
  programIds: z.array(z.string()).describe('The program IDs that were not whitelisted').optional(),
});

export const evalAllowResultSchema = z.object({
  programIds: z
    .array(z.string())
    .describe('The program IDs found in the transaction that were allowed'),
});

export const evalDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the evaluation.'),
  programIds: z.array(z.string()).describe('The program IDs that were not whitelisted').optional(),
});
