import { z } from 'zod';

export const abilityParamsSchema = z.object({
  rpcUrl: z
    .string()
    .describe(
      'The RPC URL to use for the Solana cluster the transaction is intended for (used to verify blockhash). Only available for precheck, execute will use the Lit provided RPC URL.',
    )
    .nullable(),
  cluster: z
    .enum(['devnet', 'testnet', 'mainnet-beta'])
    .describe('The Solana cluster the transaction is intended for (used to verify blockhash)'),
  serializedTransaction: z
    .string()
    .describe('The base64 encoded serialized Solana transaction to be evaluated'),
});

export const userParamsSchema = z.object({
  whitelist: z.record(
    z
      .enum(['devnet', 'testnet', 'mainnet-beta'])
      .describe('The Solana cluster the transaction is intended for'),
    z
      .array(z.string())
      .describe('Array of whitelisted Solana program IDs (base58 encoded public keys)'),
  ),
});

export const precheckAllowResultSchema = z.object({
  whitelistedProgramIds: z
    .array(z.string())
    .describe('The program IDs found in the transaction that were allowed'),
});

export const precheckDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the precheck.'),
  nonWhitelistedProgramIds: z
    .array(z.string())
    .describe('The program IDs that were not whitelisted')
    .optional(),
});

export const evalAllowResultSchema = z.object({
  whitelistedProgramIds: z
    .array(z.string())
    .describe('The program IDs found in the transaction that were allowed'),
});

export const evalDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the evaluation.'),
  nonWhitelistedProgramIds: z
    .array(z.string())
    .describe('The program IDs that were not whitelisted')
    .optional(),
});
