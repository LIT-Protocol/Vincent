import type { Address, Chain } from 'viem';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addressToEmptyAccount, createKernelAccount } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { serializePermissionAccount, toPermissionValidator } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';

export async function createPermissionApproval({
  userEoaPrivateKey,
  sessionKeyAddress,
  accountIndexHash,
  targetChain,
  targetChainRpcUrl,
}: {
  userEoaPrivateKey: `0x${string}`;
  sessionKeyAddress: Address;
  accountIndexHash: string;
  targetChain: Chain;
  targetChainRpcUrl: string;
}): Promise<string> {
  const publicClient = createPublicClient({
    chain: targetChain,
    transport: http(targetChainRpcUrl),
  });

  const userEoaAccount = privateKeyToAccount(userEoaPrivateKey);

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: userEoaAccount,
    kernelVersion: KERNEL_V3_3,
  });

  const emptySessionKeyAccount = addressToEmptyAccount(sessionKeyAddress);
  const emptySessionKeySigner = await toECDSASigner({
    signer: emptySessionKeyAccount,
  });

  const permissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: emptySessionKeySigner,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_3,
  });

  const sessionKeyAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: ecdsaValidator,
      regular: permissionPlugin,
    },
    kernelVersion: KERNEL_V3_3,
    index: BigInt(accountIndexHash),
  });

  return await serializePermissionAccount(sessionKeyAccount);
}
