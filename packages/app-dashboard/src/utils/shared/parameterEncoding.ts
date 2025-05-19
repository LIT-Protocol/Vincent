import * as ethers from 'ethers';

import { ParameterType, PARAMETER_TYPE_NAMES } from '@/services/types/parameterTypes';

/**
 * Encodes a parameter value based on its type
 * @param paramType - The parameter type from ParameterType enum
 * @param paramValue - The value to encode
 * @param paramName - Optional name for logging purposes
 * @returns Encoded parameter as Uint8Array
 */
export const encodeParameterValue = (
  paramType: number,
  paramValue: any,
  paramName = 'unnamed',
): Uint8Array => {
  const typeName = PARAMETER_TYPE_NAMES[paramType] || `unknown(${paramType})`;
  console.log(`Encoding parameter ${paramName} with type ${paramType} (${typeName})`, paramValue);

  switch (paramType) {
    case ParameterType.INT256: // int256
      if (paramValue === '') {
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['int256'], [0]));
      }
      return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['int256'], [paramValue]));

    case ParameterType.INT256_ARRAY: {
      // int256[]
      const arrayValue = parseArrayValue(paramValue, (value) => {
        if (String(value).trim() === '-') return 0;
        const num = parseInt(String(value).trim(), 10);
        return isNaN(num) ? 0 : num;
      });
      return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['int256[]'], [arrayValue]));
    }

    case ParameterType.UINT256: // uint256
      if (paramValue === '') {
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['uint256'], [0]));
      }
      return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['uint256'], [paramValue]));

    case ParameterType.UINT256_ARRAY: {
      // uint256[]
      const arrayValue = parseArrayValue(paramValue, (value) => {
        const num = parseInt(String(value).trim(), 10);
        return isNaN(num) || num < 0 ? 0 : num;
      });
      return ethers.utils.arrayify(
        ethers.utils.defaultAbiCoder.encode(['uint256[]'], [arrayValue]),
      );
    }

    case ParameterType.BOOL: // bool
      return ethers.utils.arrayify(
        ethers.utils.defaultAbiCoder.encode(
          ['bool'],
          [paramValue === true || paramValue === 'true' || paramValue === '1' || paramValue === 1],
        ),
      );

    case ParameterType.BOOL_ARRAY: {
      // bool[]
      const arrayValue = parseArrayValue(paramValue, (value) => {
        const trimmed = typeof value === 'string' ? value.trim() : value;
        return trimmed === true || trimmed === 'true' || trimmed === '1' || trimmed === 1;
      });
      return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['bool[]'], [arrayValue]));
    }

    case ParameterType.ADDRESS: // address
      if (paramValue === '') {
        return ethers.utils.arrayify(
          ethers.utils.defaultAbiCoder.encode(
            ['address'],
            ['0x0000000000000000000000000000000000000000'],
          ),
        );
      }
      return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['address'], [paramValue]));

    case ParameterType.ADDRESS_ARRAY: {
      // address[]
      let arrayValue = parseArrayValue(paramValue, (value) => value.trim());
      arrayValue = arrayValue.filter((addr) => addr !== '');
      return ethers.utils.arrayify(
        ethers.utils.defaultAbiCoder.encode(['address[]'], [arrayValue]),
      );
    }

    case ParameterType.STRING: // string
      return ethers.utils.arrayify(
        ethers.utils.defaultAbiCoder.encode(['string'], [String(paramValue)]),
      );

    case ParameterType.STRING_ARRAY: {
      // string[]
      const arrayValue = parseArrayValue(
        paramValue,
        (value) => String(value),
        ParameterType.STRING_ARRAY,
      );
      return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['string[]'], [arrayValue]));
    }

    case ParameterType.BYTES: // bytes
      if (typeof paramValue === 'string' && paramValue.startsWith('0x')) {
        return ethers.utils.arrayify(
          ethers.utils.defaultAbiCoder.encode(['bytes'], [ethers.utils.arrayify(paramValue)]),
        );
      } else {
        return ethers.utils.arrayify(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes'],
            [ethers.utils.toUtf8Bytes(String(paramValue))],
          ),
        );
      }

    case ParameterType.BYTES_ARRAY: {
      // bytes[]
      const arrayValue = parseArrayValue(paramValue, (value) => {
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.startsWith('0x')) {
            return ethers.utils.arrayify(trimmed);
          }
          return ethers.utils.toUtf8Bytes(trimmed);
        }
        return ethers.utils.toUtf8Bytes(String(value));
      });

      return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['bytes[]'], [arrayValue]));
    }

    default:
      throw new Error(`Unsupported parameter type: ${paramType} (${typeName})`);
  }
};

/**
 * Parses a value into an array based on the conversion function
 * @param value - The value to parse (string, array, or primitive)
 * @param converter - Function to convert each item
 * @param paramType - Optional parameter type to handle special cases
 * @returns Array of converted values
 */
function parseArrayValue<T>(value: any, converter: (item: any) => T, paramType?: number): T[] {
  if (typeof value === 'string' && value.includes(',')) {
    if (paramType === ParameterType.STRING_ARRAY) {
      return value.split(',').map((item) => converter(item));
    }
    return value.split(',').map((item) => converter(item.trim()));
  } else if (Array.isArray(value)) {
    return value.map(converter);
  } else if (value !== '') {
    return [converter(value)];
  }
  return [];
}
