import { z } from 'zod';

export const eip712ParamsSchema = z.object({
  domain: z.record(z.any()).describe('EIP-712 domain'),
  types: z
    .record(z.array(z.object({ name: z.string(), type: z.string() })))
    .describe('EIP-712 types'),
  primaryType: z.string().describe('EIP-712 primary type'),
  message: z
    .record(z.string(), z.union([z.string(), z.record(z.string(), z.any())]))
    .describe(
      'EIP-712 message template. Values must be strings starting with $ that resolve to a valid param (e.g. $userOp.sender, $validUntil).',
    )
    .refine(
      (data) => {
        const validateValue = (value: any): boolean => {
          if (typeof value === 'string') {
            return (
              value.startsWith('$') &&
              /^\$(userOp\.(sender|nonce|initCode|callData|callGasLimit|verificationGasLimit|preVerificationGas|maxFeePerGas|maxPriorityFeePerGas|paymasterAndData|signature|factory|factoryData|paymaster|paymasterData|paymasterPostOpGasLimit|paymasterVerificationGasLimit)|entryPointAddress|validAfter|validUntil|safe4337ModuleAddress)$/.test(
                value,
              )
            );
          }
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).every(validateValue);
          }
          return false;
        };
        return Object.values(data).every(validateValue);
      },
      {
        message:
          'Invalid message value. Must be a reference string starting with $ (e.g. $userOp.sender) or a nested object containing references.',
      },
    ),
});

export type Eip712Params = z.infer<typeof eip712ParamsSchema>;
