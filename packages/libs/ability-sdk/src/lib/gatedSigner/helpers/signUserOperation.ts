import type { Address, Hex } from 'viem';
import type { UserOperation } from 'viem/account-abstraction';

import { createPublicClient, concat, http, pad, toHex } from 'viem';
import { getUserOperationHash } from 'viem/account-abstraction';

import type { Eip712Params } from './eip712';
import type { UserOp } from './userOperation';

import { toLitActionAccount } from './toLitActionAccount';

export interface SignUserOperationParams {
  alchemyRpcUrl: string;
  entryPointAddress: Address;
  pkpPublicKey: Hex;
  userOp: UserOp;
  validAfter: number;
  validUntil: number;
  safe4337ModuleAddress: Address;
  eip712Params?: Eip712Params;
}

export async function signUserOperation({
  alchemyRpcUrl,
  entryPointAddress,
  pkpPublicKey,
  userOp,
  validAfter,
  validUntil,
  safe4337ModuleAddress,
  eip712Params,
}: SignUserOperationParams) {
  const publicClient = createPublicClient({
    transport: http(alchemyRpcUrl),
  });
  const chainId = await publicClient.getChainId();
  const account = toLitActionAccount(pkpPublicKey);

  const userOperationToHash: UserOperation<'0.7'> = {
    ...userOp,
    callGasLimit: BigInt(userOp.callGasLimit),
    maxFeePerGas: BigInt(userOp.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(userOp.maxPriorityFeePerGas),
    nonce: BigInt(userOp.nonce),
    paymasterPostOpGasLimit: BigInt(userOp.paymasterPostOpGasLimit),
    paymasterVerificationGasLimit: BigInt(userOp.paymasterVerificationGasLimit),
    preVerificationGas: BigInt(userOp.preVerificationGas),
    verificationGasLimit: BigInt(userOp.verificationGasLimit),
  };

  if (eip712Params) {
    const resolveValue = (value: any): any => {
      if (typeof value === 'string' && value.startsWith('$')) {
        switch (value) {
          case '$userOp.sender':
            return userOperationToHash.sender;
          case '$userOp.nonce':
            return userOperationToHash.nonce;
          case '$userOp.initCode':
            if (userOperationToHash.factory && userOperationToHash.factoryData) {
              return concat([userOperationToHash.factory, userOperationToHash.factoryData]);
            }
            return '0x';
          case '$userOp.callData':
            return userOperationToHash.callData;
          case '$userOp.callGasLimit':
            return userOperationToHash.callGasLimit;
          case '$userOp.verificationGasLimit':
            return userOperationToHash.verificationGasLimit;
          case '$userOp.preVerificationGas':
            return userOperationToHash.preVerificationGas;
          case '$userOp.maxFeePerGas':
            return userOperationToHash.maxFeePerGas;
          case '$userOp.maxPriorityFeePerGas':
            return userOperationToHash.maxPriorityFeePerGas;
          case '$userOp.paymasterAndData':
            if (userOperationToHash.paymaster) {
              return concat([
                userOperationToHash.paymaster,
                pad(toHex(userOperationToHash.paymasterVerificationGasLimit || 0n), { size: 16 }),
                pad(toHex(userOperationToHash.paymasterPostOpGasLimit || 0n), { size: 16 }),
                userOperationToHash.paymasterData || '0x',
              ]);
            }
            return '0x';
          case '$userOp.signature':
            return userOperationToHash.signature;
          case '$userOp.factory':
            return userOperationToHash.factory;
          case '$userOp.factoryData':
            return userOperationToHash.factoryData;
          case '$userOp.paymaster':
            return userOperationToHash.paymaster;
          case '$userOp.paymasterData':
            return userOperationToHash.paymasterData;
          case '$userOp.paymasterVerificationGasLimit':
            return userOperationToHash.paymasterVerificationGasLimit;
          case '$userOp.paymasterPostOpGasLimit':
            return userOperationToHash.paymasterPostOpGasLimit;
          case '$entryPointAddress':
            return entryPointAddress;
          case '$validAfter':
            return validAfter;
          case '$validUntil':
            return validUntil;
          case '$safe4337ModuleAddress':
            return safe4337ModuleAddress;
          case '$chainId':
            return chainId;
          default:
            throw new Error(`Unknown mapping reference: ${value}`);
        }
      }
      if (typeof value === 'object' && value !== null) {
        const result: Record<string, any> = {};
        for (const key in value) {
          result[key] = resolveValue(value[key]);
        }
        return result;
      }
      return value;
    };

    const message = resolveValue(eip712Params.message);
    const domain = resolveValue(eip712Params.domain);

    return await account.signTypedData({
      domain,
      types: eip712Params.types,
      primaryType: eip712Params.primaryType,
      message,
    });
  }

  const userOpHash = getUserOperationHash({
    chainId,
    entryPointAddress,
    entryPointVersion: '0.7',
    userOperation: userOperationToHash,
  });

  return await account.signMessage({
    message: { raw: userOpHash },
  });
}
