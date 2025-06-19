// Define Parameter Type enum values
export enum ParameterType {
  INT256 = 0,
  INT256_ARRAY = 1,
  UINT256 = 2,
  UINT256_ARRAY = 3,
  BOOL = 4,
  BOOL_ARRAY = 5,
  ADDRESS = 6,
  ADDRESS_ARRAY = 7,
  STRING = 8,
  STRING_ARRAY = 9,
  BYTES = 10,
  BYTES_ARRAY = 11
}

// Mapping from parameter type enum values to human-readable names
export const PARAMETER_TYPE_MAP: Record<string, number> = {
  "int256": ParameterType.INT256,
  "int256[]": ParameterType.INT256_ARRAY,
  "uint256": ParameterType.UINT256,
  "uint256[]": ParameterType.UINT256_ARRAY,
  "bool": ParameterType.BOOL,
  "bool[]": ParameterType.BOOL_ARRAY,
  "address": ParameterType.ADDRESS,
  "address[]": ParameterType.ADDRESS_ARRAY,
  "string": ParameterType.STRING,
  "string[]": ParameterType.STRING_ARRAY,
  "bytes": ParameterType.BYTES,
  "bytes[]": ParameterType.BYTES_ARRAY
};

// Mapping from enum values to human-readable type names
export const PARAMETER_TYPE_NAMES: Record<number, string> = {
  [ParameterType.INT256]: "int256",
  [ParameterType.INT256_ARRAY]: "int256[]",
  [ParameterType.UINT256]: "uint256",
  [ParameterType.UINT256_ARRAY]: "uint256[]",
  [ParameterType.BOOL]: "bool",
  [ParameterType.BOOL_ARRAY]: "bool[]",
  [ParameterType.ADDRESS]: "address",
  [ParameterType.ADDRESS_ARRAY]: "address[]",
  [ParameterType.STRING]: "string",
  [ParameterType.STRING_ARRAY]: "string[]",
  [ParameterType.BYTES]: "bytes",
  [ParameterType.BYTES_ARRAY]: "bytes[]"
};

// Function to convert a type string to its enum value
export const mapTypeToEnum = (type: string): number => {
  const normalizedType = type.toLowerCase().trim();
  const result = PARAMETER_TYPE_MAP[normalizedType];

  return result !== undefined ? result : ParameterType.STRING; // Default to string if not found
};

// Function to convert an enum value to its human-readable name
export const mapEnumToTypeName = (enumValue: number): string => {
  return PARAMETER_TYPE_NAMES[enumValue] || "string"; // Default to string if not found
}; 