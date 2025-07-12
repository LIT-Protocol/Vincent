import { encodeAbiParameters, isHex, toHex } from 'viem';
import { z } from 'zod';

export const ParameterType = {
  INT256: 0,
  INT256_ARRAY: 1,
  UINT256: 2,
  UINT256_ARRAY: 3,
  BOOL: 4,
  BOOL_ARRAY: 5,
  ADDRESS: 6,
  ADDRESS_ARRAY: 7,
  STRING: 8,
  STRING_ARRAY: 9,
  BYTES: 10,
  BYTES_ARRAY: 11,
} as const;

type ParameterTypeString = keyof typeof ParameterType;

export const parameterTypeSchema = z
  .enum(Object.keys(ParameterType) as [ParameterTypeString, ...ParameterTypeString[]])
  .transform((type) => ParameterType[type]);

export type ParameterTypeInput = z.input<typeof parameterTypeSchema>;

export const policySchema = z.object({
  type: z.enum([
    'address',
    'address[]',
    'int256',
    'int256[]',
    'uint256',
    'uint256[]',
    'bool',
    'bool[]',
    'string',
    'string[]',
    'bytes',
    'bytes[]',
  ]),
  value: z.string(),
});

export const createPolicyParameterValue = (
  type: PolicyParameterValue['type'],
  value: string,
): PolicyParameterValue => ({
  type,
  value,
});

export type PolicyParameterValue = z.infer<typeof policySchema>;
export type PolicyParameterValues = PolicyParameterValue[][][];

// Base schema for raw values
export const rawParameterValueSchema = z.array(z.array(z.array(policySchema)));

/**
 * Schema that transforms raw parameter values into their hex-encoded format.
 */
export const hexEncodedParameterValueSchema = rawParameterValueSchema.transform((values) =>
  values.map((toolPolicies) =>
    toolPolicies.map((policies) =>
      policies.map((policy: z.infer<typeof policySchema>) => {
        switch (policy.type) {
          case 'address':
            return encodeAbiParameters([{ type: 'address' }], [policy.value as `0x${string}`]);
          case 'address[]':
            const addressArray = policy.value
              .split(',')
              .map((addr) => addr.trim() as `0x${string}`);
            return encodeAbiParameters([{ type: 'address[]' }], [addressArray]);
          case 'int256':
            return encodeAbiParameters([{ type: 'int256' }], [BigInt(policy.value)]);
          case 'int256[]':
            const int256Array = policy.value.split(',').map((num) => BigInt(num.trim()));
            return encodeAbiParameters([{ type: 'int256[]' }], [int256Array]);
          case 'uint256':
            return encodeAbiParameters([{ type: 'uint256' }], [BigInt(policy.value)]);
          case 'uint256[]':
            const uint256Array = policy.value.split(',').map((num) => BigInt(num.trim()));
            return encodeAbiParameters([{ type: 'uint256[]' }], [uint256Array]);
          case 'bool':
            return encodeAbiParameters([{ type: 'bool' }], [policy.value.toLowerCase() === 'true']);
          case 'bool[]':
            const boolArray = policy.value.split(',').map((b) => b.trim().toLowerCase() === 'true');
            return encodeAbiParameters([{ type: 'bool[]' }], [boolArray]);
          case 'string':
            return encodeAbiParameters([{ type: 'string' }], [policy.value]);
          case 'string[]':
            const stringArray = policy.value.split(',').map((s) => s.trim());
            return encodeAbiParameters([{ type: 'string[]' }], [stringArray]);
          case 'bytes':
            const bytesValue = isHex(policy.value)
              ? (policy.value as `0x${string}`)
              : toHex(policy.value);
            return encodeAbiParameters([{ type: 'bytes' }], [bytesValue]);
          case 'bytes[]':
            const bytesArray = policy.value
              .split(',')
              .map((b) => (isHex(b.trim()) ? (b.trim() as `0x${string}`) : toHex(b.trim())));
            return encodeAbiParameters([{ type: 'bytes[]' }], [bytesArray]);
          default:
            throw new Error(`Unsupported policy type: ${policy.type}`);
        }
      }),
    ),
  ),
);
