import { z } from 'zod';

export const abilityParamsSchema = z.object({
  serializedTransaction: z
    .string()
    .describe('The base64 encoded serialized Solana transaction to be evaluated and signed'),
  ciphertext: z.string().describe('The encrypted private key ciphertext for the Agent Wallet'),
  dataToEncryptHash: z.string().describe('SHA-256 hash of the encrypted data for verification'),
  versionedTransaction: z
    .boolean()
    .optional()
    .describe('Whether this is a versioned transaction (v0) or legacy transaction'),
});

export const precheckFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the precheck failed.'),
});

export const executeSuccessSchema = z.object({
  signedTransaction: z.string().describe('The base64 encoded signed Solana transaction'),
});

export const executeFailSchema = z
  .object({
    error: z.string().describe('A string containing the error message if the execution failed.'),
  })
  .optional();
