import { z } from 'zod';

export const abilityParamsSchema = z.object({
  rpcUrl: z.string().describe('The RPC URL for the Solana cluster').optional(),
  cluster: z
    .enum(['devnet', 'testnet', 'mainnet-beta'])
    .describe('The Solana cluster the transaction is intended for (used to verify blockhash)'),
  serializedTransaction: z
    .string()
    .describe(
      'The base64 encoded serialized Solana transaction to be evaluated and signed (transaction type is auto-detected)',
    ),
  ciphertext: z.string().describe('The encrypted private key ciphertext for the Agent Wallet'),
  dataToEncryptHash: z.string().describe('SHA-256 hash of the encrypted data for verification'),
  legacyTransactionOptions: z
    .object({
      requireAllSignatures: z
        .boolean()
        .describe(
          'If true, serialization will fail unless all required signers have provided valid signatures. Set false to allow returning a partially signed transaction (useful for multisig or co-signing flows). Defaults to true.',
        ),
      verifySignatures: z
        .boolean()
        .describe('If true, verify each signature before serialization. Defaults to false.'),
    })
    .optional(),
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
