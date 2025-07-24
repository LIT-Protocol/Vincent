import { z } from 'zod';

export const toolParamsSchema = z.object({
  serializedTransaction: z
    .string()
    .describe('The serialized transaction to be evaluated and signed'),
});

export const precheckSuccessSchema = z.object({
  deserializedUnsignedTransaction: z.object({
    to: z.string().nullable().optional().describe('The address the transaction is being sent to'),
    nonce: z.number().optional().describe('The transaction nonce'),

    gasLimit: z.string().describe('The gas limit'),
    gasPrice: z.string().optional().describe('The gas price'),

    data: z.string().describe('The data of the transaction'),
    value: z.string().describe('The value sent'),
    chainId: z.number().describe('The chain ID'),

    type: z.number().optional().describe('The transaction type'),

    accessList: z.array(z.any()).optional().describe('The access list (EIP-2930)'),

    maxPriorityFeePerGas: z.string().optional().describe('EIP-1559 maxPriorityFeePerGas'),
    maxFeePerGas: z.string().optional().describe('EIP-1559 maxFeePerGas'),
  }),
});

export const precheckFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the precheck failed.'),
});

export const executeSuccessSchema = z.object({
  signedTransaction: z.string().describe('The signed transaction'),
  deserializedSignedTransaction: z.object({
    hash: z.string().optional().describe('The transaction hash'),

    to: z.string().nullable().optional().describe('The address the transaction is being sent to'),
    from: z.string().nullable().optional().describe('The address the transaction is sent from'),
    nonce: z.number().describe('The transaction nonce'),

    gasLimit: z.string().describe('The gas limit'),
    gasPrice: z.string().nullable().optional().describe('The gas price'),

    data: z.string().describe('The data of the transaction'),
    value: z.string().describe('The value sent'),
    chainId: z.number().describe('The chain ID'),

    v: z.number().optional().describe('The v value of the signature'),
    r: z.string().optional().describe('The r value of the signature'),
    s: z.string().optional().describe('The s value of the signature'),

    type: z.number().nullable().optional().describe('The transaction type'),

    accessList: z.array(z.any()).optional().describe('The access list (EIP-2930)'),

    maxPriorityFeePerGas: z
      .string()
      .nullable()
      .optional()
      .describe('EIP-1559 maxPriorityFeePerGas'),
    maxFeePerGas: z.string().nullable().optional().describe('EIP-1559 maxFeePerGas'),
  }),
});

export const executeFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the execution failed.'),
});
