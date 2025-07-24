import { z } from 'zod';

export const toolParamsSchema = z.object({
  serializedTransaction: z
    .string()
    .describe('The serialized transaction to be evaluated and signed'),
});

export const userParamsSchema = z.object({
  whitelist: z.record(
    z.string(), // chainId
    z.record(
      z.string(), // contract address
      z.object({
        functionSelectors: z.array(z.string()),
      }),
    ),
  ),
});

export const precheckAllowResultSchema = z.object({
  chainId: z.number().describe('The chain ID the serialized transaction is being sent to'),
  contractAddress: z
    .string()
    .describe('The contract address the serialized transaction is being sent to'),
  functionSelector: z.string().describe('The function selector of the serialized transaction'),
});

export const precheckDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the precheck.'),
  chainId: z
    .number()
    .describe('The chain ID the serialized transaction is being sent to')
    .optional(),
  contractAddress: z
    .string()
    .describe('The contract address the serialized transaction is being sent to')
    .optional(),
  functionSelector: z
    .string()
    .describe('The function selector of the serialized transaction')
    .optional(),
});

export const evalAllowResultSchema = z.object({
  chainId: z.number().describe('The chain ID the serialized transaction is being sent to'),
  contractAddress: z
    .string()
    .describe('The contract address the serialized transaction is being sent to'),
  functionSelector: z.string().describe('The function selector of the serialized transaction'),
});

export const evalDenyResultSchema = z.object({
  reason: z.string().describe('The reason for denying the evaluation.'),
  chainId: z
    .number()
    .describe('The chain ID the serialized transaction is being sent to')
    .optional(),
  contractAddress: z
    .string()
    .describe('The contract address the serialized transaction is being sent to')
    .optional(),
  functionSelector: z
    .string()
    .describe('The function selector of the serialized transaction')
    .optional(),
});
