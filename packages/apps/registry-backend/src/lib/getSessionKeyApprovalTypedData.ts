import type { Address } from 'viem';

import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { serializePermissionAccount, toPermissionValidator } from '@zerodev/permissions';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { addressToEmptyAccount, createKernelAccount } from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { toAccount } from 'viem/accounts';

import { deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

import { getSmartAccountPublicClient } from './chainConfig';

export interface GetSessionKeyApprovalTypedDataParams {
  userControllerAddress: Address;
  agentSignerAddress: Address;
  appId: number;
}

export const getSessionKeyApprovalTypedData = async ({
  userControllerAddress,
  agentSignerAddress,
  appId,
}: GetSessionKeyApprovalTypedDataParams) => {
  const smartAccountPublicClient = getSmartAccountPublicClient();

  let sessionKeyApprovalToSign = null;
  const fakeUserEoaSigner = toAccount({
    address: userControllerAddress,
    async signMessage() {
      throw new Error('[getSessionKeyApprovalTypedData] signMessage not supported');
    },
    async signTransaction() {
      throw new Error('[getSessionKeyApprovalTypedData] signTransaction not supported');
    },
    async signTypedData(parameters) {
      console.log('[getSessionKeyApprovalTypedData] signTypedData');
      sessionKeyApprovalToSign = parameters;
      return '0x';
    },
  });

  const fakeUserEoaEcdsaValidator = await signerToEcdsaValidator(smartAccountPublicClient, {
    signer: fakeUserEoaSigner,
    entryPoint: getEntryPoint('0.7'),
    kernelVersion: KERNEL_V3_3,
  });

  const emptyAgentSignerAccount = addressToEmptyAccount(agentSignerAddress);
  const emptyAgentSigner = await toECDSASigner({ signer: emptyAgentSignerAccount });

  const permissionPlugin = await toPermissionValidator(smartAccountPublicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: emptyAgentSigner,
    policies: [
      // Sudo policy allows everything - full permissions for agent signer
      toSudoPolicy({}),
    ],
    kernelVersion: KERNEL_V3_3,
  });

  const fakeUserEoaKernelAccount = await createKernelAccount(smartAccountPublicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: fakeUserEoaEcdsaValidator,
      regular: permissionPlugin,
    },
    kernelVersion: KERNEL_V3_3,
    index: deriveSmartAccountIndex(appId),
  });

  // We don't care about this signature, we just want to capture the message
  // to sign with the user's remote EOA signer
  await serializePermissionAccount(fakeUserEoaKernelAccount);

  return sessionKeyApprovalToSign;
};
