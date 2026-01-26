import type { Address, Chain } from 'viem';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addressToEmptyAccount, createKernelAccount } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { serializePermissionAccount, toPermissionValidator } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';

/**
 * Creates a serialized permission approval that allows a session key (PKP) to act on behalf of the smart account.
 *
 * This follows the ZeroDev pattern from transaction-automation.ts:
 * 1. Owner creates an account with BOTH validators (EOA sudo + session key permission)
 * 2. Serializes the permission account
 * 3. Session key can later deserialize and use it to sign transactions
 *
 * The serialized approval contains:
 * - Smart account configuration (sudo validator = EOA)
 * - Permission validator configuration (session key = PKP with sudo policy)
 * - All necessary data for the session key to reconstruct the account
 *
 * @param params Configuration for creating the permission approval
 * @returns Serialized permission approval string that can be deserialized by the session key
 */
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
