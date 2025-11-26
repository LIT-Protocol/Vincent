import { Address, createPublicClient, Hex, http } from 'viem';
import { getUserOperationHash, UserOperation } from 'viem/account-abstraction';

import { toLitActionAccount } from './toLitActionAccount';
import { UserOp } from './userOperation';

export interface SignUserOperationParams {
  alchemyRpcUrl: string;
  entryPointAddress: Address;
  pkpPublicKey: Hex;
  userOp: UserOp;
}

export async function signUserOperation({
  alchemyRpcUrl,
  entryPointAddress,
  pkpPublicKey,
  userOp,
}: SignUserOperationParams) {
  const publicClient = createPublicClient({
    transport: http(alchemyRpcUrl),
  });
  const chainId = await publicClient.getChainId();
  const account = toLitActionAccount(pkpPublicKey);

  // Build UserOp for hashing - only include defined fields
  const userOperationToHash: UserOperation<'0.7'> = {
    sender: userOp.sender,
    nonce: BigInt(userOp.nonce),
    callData: userOp.callData,
    callGasLimit: BigInt(userOp.callGasLimit),
    verificationGasLimit: BigInt(userOp.verificationGasLimit),
    preVerificationGas: BigInt(userOp.preVerificationGas),
    maxFeePerGas: BigInt(userOp.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(userOp.maxPriorityFeePerGas),
    signature: '0x',
  };

  // Add optional factory fields if present
  if (userOp.factory) {
    userOperationToHash.factory = userOp.factory;
    userOperationToHash.factoryData = userOp.factoryData;
  }

  // Add optional paymaster fields if present
  if (userOp.paymaster) {
    userOperationToHash.paymaster = userOp.paymaster;
    userOperationToHash.paymasterData = userOp.paymasterData;
    if (userOp.paymasterVerificationGasLimit) {
      userOperationToHash.paymasterVerificationGasLimit = BigInt(
        userOp.paymasterVerificationGasLimit,
      );
    }
    if (userOp.paymasterPostOpGasLimit) {
      userOperationToHash.paymasterPostOpGasLimit = BigInt(userOp.paymasterPostOpGasLimit);
    }
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
