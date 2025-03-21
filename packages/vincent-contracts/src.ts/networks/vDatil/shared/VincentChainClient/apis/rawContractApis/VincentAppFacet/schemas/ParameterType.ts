import { z } from "zod";

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
  BYTES_ARRAY: 11
} as const;

type ParameterTypeString = keyof typeof ParameterType;

export const parameterTypeSchema = z.enum(Object.keys(ParameterType) as [ParameterTypeString, ...ParameterTypeString[]])
  .transform(type => ParameterType[type]);

export type ParameterTypeInput = z.input<typeof parameterTypeSchema>;
