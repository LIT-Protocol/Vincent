import type { Address } from 'viem';

import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { http } from 'viem';
import { toAccount } from 'viem/accounts';

import { deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

import { getSmartAccountPublicClient, getSmartAccountChain } from './chainConfig';
import { getZerodevBundlerRpcUrl } from './getZerodevBundlerRpcUrl';

export interface GetAppInstallTypedDataToSignParams {
  userControllerAddress: Address;
  appId: number;
}

export const getAppInstallTypedDataToSign = async ({
  userControllerAddress,
  appId,
}: GetAppInstallTypedDataToSignParams) => {
  const smartAccountPublicClient = getSmartAccountPublicClient();
  const smartAccountChain = getSmartAccountChain();

  let deployMessageToSign = null;
  const fakeUserEoaSigner = toAccount({
    address: userControllerAddress,
    async signMessage({ message }) {
      console.log('[getAppInstallTypedData] signMessage');
      deployMessageToSign = message;
      return '0x';
    },
    async signTransaction(transaction, options) {
      throw new Error('signTransaction not supported');
    },
    async signTypedData(parameters) {
      throw new Error('signTypedData not supported');
    },
  });

  const emptyUserEoaEcdsaValidator = await signerToEcdsaValidator(smartAccountPublicClient, {
    signer: fakeUserEoaSigner as any,
    entryPoint: getEntryPoint('0.7'),
    kernelVersion: KERNEL_V3_3,
  });

  const userEoaKernelAccount = await createKernelAccount(smartAccountPublicClient, {
    plugins: {
      sudo: emptyUserEoaEcdsaValidator,
    },
    entryPoint: getEntryPoint('0.7'),
    kernelVersion: KERNEL_V3_3,
    index: deriveSmartAccountIndex(appId),
  });

  // Note: We don't need a paymaster here because we're only preparing the UserOperation
  // to capture the message to sign. The actual submission happens in completeInstallation.
  // We use the ZeroDev bundler URL to get gas estimates for the UserOperation.
  const userEoaKernelAccountClient = createKernelAccountClient({
    account: userEoaKernelAccount,
    chain: smartAccountChain,
    bundlerTransport: http(getZerodevBundlerRpcUrl(smartAccountChain.id)),
    client: smartAccountPublicClient,
  });

  const deployUserOp = await userEoaKernelAccountClient.prepareUserOperation({
    callData: await userEoaKernelAccountClient.account.encodeCalls([
      {
        to: '0x0000000000000000000000000000000000000000',
        value: BigInt(0),
        data: '0x',
      },
    ]),
  });

  // We don't care about this signature, we just want to capture the message
  // to sign with the user's remote EOA signer
  await userEoaKernelAccountClient.signUserOperation(deployUserOp);

  // Convert BigInt values to strings for JSON serialization
  const serializableUserOp = {
    ...deployUserOp,
    nonce: deployUserOp.nonce.toString(),
    callGasLimit: deployUserOp.callGasLimit.toString(),
    verificationGasLimit: deployUserOp.verificationGasLimit.toString(),
    preVerificationGas: deployUserOp.preVerificationGas.toString(),
    maxFeePerGas: deployUserOp.maxFeePerGas.toString(),
    maxPriorityFeePerGas: deployUserOp.maxPriorityFeePerGas.toString(),
    paymasterVerificationGasLimit: deployUserOp.paymasterVerificationGasLimit?.toString() || '0',
    paymasterPostOpGasLimit: deployUserOp.paymasterPostOpGasLimit?.toString() || '0',
  };

  return {
    messageToSign: deployMessageToSign!.raw, // Hex string to sign
    userOperation: serializableUserOp, // Full UserOperation object to reuse with signature
  };
};
