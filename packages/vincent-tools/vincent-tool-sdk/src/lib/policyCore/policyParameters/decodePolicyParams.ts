// src/lib/policyCore/policyParameters/decodePolicyParams.ts

import { ethers } from 'ethers';

import type { EthersAbiDecodedValue, PolicyParameter } from './types';

const OnChainPolicyParamType = {
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

export const decodePolicyParams = ({
  params,
}: {
  params: PolicyParameter[];
}): Record<string, EthersAbiDecodedValue> => {
  try {
    const result: Record<string, EthersAbiDecodedValue> = {};

    for (const param of params) {
      const { name, paramType, value } = param;

      switch (paramType) {
        case OnChainPolicyParamType.INT256:
          result[name] = ethers.utils.defaultAbiCoder.decode(['int256'], value)[0];
          break;
        case OnChainPolicyParamType.INT256_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['int256[]'], value)[0];
          break;
        case OnChainPolicyParamType.UINT256:
          result[name] = ethers.utils.defaultAbiCoder.decode(['uint256'], value)[0];
          break;
        case OnChainPolicyParamType.UINT256_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['uint256[]'], value)[0];
          break;
        case OnChainPolicyParamType.BOOL:
          result[name] = ethers.utils.defaultAbiCoder.decode(['bool'], value)[0];
          break;
        case OnChainPolicyParamType.BOOL_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['bool[]'], value)[0];
          break;
        case OnChainPolicyParamType.ADDRESS:
          result[name] = ethers.utils.defaultAbiCoder.decode(['address'], value)[0];
          break;
        case OnChainPolicyParamType.ADDRESS_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['address[]'], value)[0];
          break;
        case OnChainPolicyParamType.STRING:
          result[name] = ethers.utils.defaultAbiCoder.decode(['string'], value)[0];
          break;
        case OnChainPolicyParamType.STRING_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['string[]'], value)[0];
          break;
        case OnChainPolicyParamType.BYTES:
          result[name] = ethers.utils.defaultAbiCoder.decode(['bytes'], value)[0];
          break;
        case OnChainPolicyParamType.BYTES_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['bytes[]'], value)[0];
          break;
        default:
          throw new Error(`Unknown parameter type: ${paramType}`);
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `Error decoding policy parameters (abiDecodePolicyParameters): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
