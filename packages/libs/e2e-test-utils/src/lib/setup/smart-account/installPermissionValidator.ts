import type { Address, Chain } from 'viem';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createKernelAccount,
  createKernelAccountClient,
  addressToEmptyAccount,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { toPermissionValidator } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';

export interface InstallPermissionValidatorParams {
  userEoaPrivateKey: `0x${string}`;
  agentSignerAddress: Address;
  accountIndexHash: string;
  targetChain: Chain;
  targetChainRpcUrl: string;
  zerodevProjectId: string;
}

export async function installPermissionValidator({
  userEoaPrivateKey,
  agentSignerAddress,
  accountIndexHash,
  targetChain,
  targetChainRpcUrl,
  zerodevProjectId,
}: InstallPermissionValidatorParams): Promise<{
  txHash: `0x${string}`;
  userOpHash: `0x${string}`;
}> {
  console.log(
    `=== Installing permission validator (PKP) on smart account on ${targetChain.name} ===`,
  );

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

  const emptySessionKeyAccount = addressToEmptyAccount(agentSignerAddress);
  const emptySessionKeySigner = await toECDSASigner({
    signer: emptySessionKeyAccount,
  });

  const permissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: emptySessionKeySigner,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_3,
  });

  const accountWithBothValidators = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: ecdsaValidator,
      regular: permissionPlugin,
    },
    kernelVersion: KERNEL_V3_3,
    index: BigInt(accountIndexHash),
  });

  const zerodevRpcUrl = `https://rpc.zerodev.app/api/v3/${zerodevProjectId}/chain/${targetChain.id}`;

  const paymasterClient = createZeroDevPaymasterClient({
    chain: targetChain,
    transport: http(zerodevRpcUrl),
  });

  const kernelClient = createKernelAccountClient({
    account: accountWithBothValidators,
    chain: targetChain,
    bundlerTransport: http(zerodevRpcUrl),
    client: publicClient,
    paymaster: {
      getPaymasterData(userOperation) {
        return paymasterClient.sponsorUserOperation({
          userOperation,
        });
      },
    },
  });

  const userOpHash = await kernelClient.sendUserOperation({
    callData: await accountWithBothValidators.encodeCalls([
      {
        to: '0x0000000000000000000000000000000000000000',
        value: 0n,
        data: '0x',
      },
    ]),
  });

  console.log(`UserOp Hash: ${userOpHash}`);

  const receipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
  const txHash = receipt.receipt.transactionHash;

  console.table({
    'PKP Signer Address': agentSignerAddress,
    'User Operation Hash': userOpHash,
    'Transaction Hash': txHash,
  });

  return {
    txHash,
    userOpHash,
  };
}
