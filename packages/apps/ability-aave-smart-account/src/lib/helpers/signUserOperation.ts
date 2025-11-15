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
    signature: '0x',
  };

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
