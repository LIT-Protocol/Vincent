import * as ethers from 'ethers';
import { ParameterType } from '@/services/types/parameterTypes';

/**
 * Decodes parameter values from their encoded form based on their type.
 * Handles different parameter types like INT256, UINT256, BOOL, ADDRESS, STRING, and their array versions.
 *
 * @param encodedValue The encoded value from the contract
 * @param paramType The parameter type (from ParameterType enum)
 * @returns The decoded value as a string or primitive value
 */
export const decodeParameterValue = (encodedValue: string, paramType: number): any => {
  try {
    switch (paramType) {
      case ParameterType.INT256:
        return ethers.utils.defaultAbiCoder.decode(['int256'], encodedValue)[0].toString();

      case ParameterType.UINT256:
        return ethers.utils.defaultAbiCoder.decode(['uint256'], encodedValue)[0].toString();

      case ParameterType.BOOL:
        return ethers.utils.defaultAbiCoder.decode(['bool'], encodedValue)[0];

      case ParameterType.ADDRESS:
        return ethers.utils.defaultAbiCoder.decode(['address'], encodedValue)[0];

      case ParameterType.STRING:
        return ethers.utils.defaultAbiCoder.decode(['string'], encodedValue)[0];

      case ParameterType.INT256_ARRAY:
        return ethers.utils.defaultAbiCoder.decode(['int256[]'], encodedValue)[0].join(',');

      case ParameterType.UINT256_ARRAY:
        return ethers.utils.defaultAbiCoder.decode(['uint256[]'], encodedValue)[0].join(',');

      case ParameterType.BOOL_ARRAY:
        return ethers.utils.defaultAbiCoder.decode(['bool[]'], encodedValue)[0].join(',');

      case ParameterType.ADDRESS_ARRAY:
        return ethers.utils.defaultAbiCoder.decode(['address[]'], encodedValue)[0].join(',');

      case ParameterType.STRING_ARRAY:
        return ethers.utils.defaultAbiCoder.decode(['string[]'], encodedValue)[0].join(',');

      // Fallback for bytes and other types
      default:
        return ethers.utils.hexlify(encodedValue);
    }
  } catch (error) {
    console.error('Error decoding parameter value:', error, { encodedValue, paramType });
    return '';
  }
};

/**
 * Utility to check if a parameter value should be considered empty
 *
 * @param value The parameter value to check
 * @param paramType The parameter type
 * @returns boolean indicating if the value should be considered empty
 */
export const isEmptyParameterValue = (
  value: string | number | boolean | null | undefined,
  type: ParameterType,
): boolean => {
  // Empty string, undefined, or null is always considered empty
  if (value === undefined || value === null || value === '') {
    return true;
  }

  // Handle array types first
  if (
    [
      ParameterType.INT256_ARRAY,
      ParameterType.UINT256_ARRAY,
      ParameterType.BOOL_ARRAY,
      ParameterType.ADDRESS_ARRAY,
      ParameterType.STRING_ARRAY,
    ].includes(type)
  ) {
    // Empty array or string representation of empty array
    if (value === '[]' || value === '') {
      return true;
    }

    try {
      // Try to parse as array
      const arrayValues = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',').map((v: string) => v.trim())
          : [value];

      return (
        arrayValues.length === 0 || arrayValues.every((v: string | number | boolean) => v === '')
      );
    } catch (e) {
      console.error('Error parsing array value in isEmptyParameterValue:', e);
      return false;
    }
  }

  // Handle non-array types
  switch (type) {
    case ParameterType.BOOL:
      if (value === undefined || value === null || value === '' || value === 'Not Set') {
        return true;
      }
      return false;
    case ParameterType.INT256:
    case ParameterType.UINT256:
      return value === '';
    case ParameterType.ADDRESS:
      return value === '';
    case ParameterType.STRING:
      return value === '';
    default:
      return false;
  }
};
