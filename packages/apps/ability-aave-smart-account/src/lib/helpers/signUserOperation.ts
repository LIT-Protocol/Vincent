import { deserializePermissionAccount } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import { Hex, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

import { toLitActionAccount } from './toLitActionAccount';

export interface SignUserOperationParams {
  alchemyRpcUrl: string;
  pkpPublicKey: Hex;
  serializedZeroDevPermissionAccount: string;
  userOp: any;
}

export async function signUserOperation({
  alchemyRpcUrl,
  pkpPublicKey,
  serializedZeroDevPermissionAccount,
  userOp,
}: SignUserOperationParams) {
  const chain = baseSepolia;
  const transport = http(alchemyRpcUrl);
  const kernelVersion = KERNEL_V3_3;
  const entryPoint = getEntryPoint('0.7');
  const publicClient = createPublicClient({
    chain,
    transport,
  });

  const pkpLitAccount = toLitActionAccount(pkpPublicKey);
  const vincentAbilitySigner = await toECDSASigner({ signer: pkpLitAccount });
  const permissionKernelAccount = await deserializePermissionAccount(
    publicClient,
    entryPoint,
    kernelVersion,
    serializedZeroDevPermissionAccount,
    vincentAbilitySigner,
  );

  const userOperationSignature = await permissionKernelAccount.signUserOperation(userOp);

  return userOperationSignature;
}
