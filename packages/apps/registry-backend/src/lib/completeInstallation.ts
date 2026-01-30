import type { ConcurrentPayloadToSign } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types';
import type { Address, Hex } from 'viem';

import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { toPermissionValidator, serializePermissionAccount } from '@zerodev/permissions';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toECDSASigner } from '@zerodev/permissions/signers';
import {
  createKernelAccount,
  createKernelAccountClient,
  addressToEmptyAccount,
} from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { http } from 'viem';
import { toAccount } from 'viem/accounts';

import { deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

import { getSmartAccountPublicClient, getSmartAccountChain } from './chainConfig';
import { completeRelayTransaction } from './completeRelayTransaction';
import { getZerodevBundlerRpcUrl } from './getZerodevBundlerRpcUrl';

export async function completeInstallation(request: {
  userControllerAddress: Address;
  appId: number;
  agentSignerAddress: Address;
  appInstallation: {
    typedDataSignature: string;
    dataToSign: ConcurrentPayloadToSign;
  };
  agentSmartAccountDeployment: {
    typedDataSignature: string;
    userOperation: any;
  };
  sessionKeyApproval: {
    typedDataSignature: string;
  };
}) {
  console.log('[completeInstallation] Starting installation process');

  // Step 1: Deploy the smart account on the smart account chain
  console.log('[completeInstallation] Deploying smart account...');
  const deployAgentSmartAccountTransactionHash = await deploySmartAccountWithSignature(
    request.userControllerAddress,
    request.appId,
    request.agentSmartAccountDeployment.userOperation,
    request.agentSmartAccountDeployment.typedDataSignature as `0x${string}`,
  );
  console.log(
    '[completeInstallation] Smart account deployed:',
    deployAgentSmartAccountTransactionHash,
  );

  // Step 2: Serialize the permission account (session key approval)
  console.log('[completeInstallation] Serializing permission account...');
  const serializedPermissionAccount = await approveSessionKeyWithSignature(
    request.userControllerAddress,
    request.agentSignerAddress,
    request.appId,
    request.sessionKeyApproval.typedDataSignature as `0x${string}`,
  );
  console.log('[completeInstallation] Permission account serialized');

  // Step 3: Complete the app installation on Vincent Registry chain (via Gelato relay)
  console.log('[completeInstallation] Completing app installation via Gelato relay...');
  const completeAppInstallationResult = await completeRelayTransaction({
    ...request.appInstallation,
    operationName: 'completeAppInstallation',
  });
  console.log(
    '[completeInstallation] App installation completed:',
    completeAppInstallationResult.transactionHash,
  );

  return {
    deployAgentSmartAccountTransactionHash,
    completeAppInstallationTransactionHash: completeAppInstallationResult.transactionHash,
    serializedPermissionAccount,
  };
}

/**
 * Deploys a smart account using a pre-signed UserOperation message
 */
async function deploySmartAccountWithSignature(
  userControllerAddress: Address,
  appId: number,
  userOperation: any,
  signature: Hex,
): Promise<string> {
  const smartAccountPublicClient = getSmartAccountPublicClient();
  const smartAccountChain = getSmartAccountChain();

  // Create empty signer/validator (we don't need real signing since we have the signature)
  const emptyUserEoaSignerAccount = addressToEmptyAccount(userControllerAddress);
  const emptyUserEoaSigner = await toECDSASigner({ signer: emptyUserEoaSignerAccount });

  const emptyUserEoaEcdsaValidator = await signerToEcdsaValidator(smartAccountPublicClient, {
    signer: emptyUserEoaSigner as any,
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

  const kernelClient = createKernelAccountClient({
    account: userEoaKernelAccount,
    chain: smartAccountChain,
    bundlerTransport: http(getZerodevBundlerRpcUrl(smartAccountChain.id)),
    client: smartAccountPublicClient,
  });

  // Convert string values back to BigInt for the ZeroDev SDK
  const userOpWithBigInts = {
    ...userOperation,
    nonce: BigInt(userOperation.nonce),
    callGasLimit: BigInt(userOperation.callGasLimit),
    verificationGasLimit: BigInt(userOperation.verificationGasLimit),
    preVerificationGas: BigInt(userOperation.preVerificationGas),
    maxFeePerGas: BigInt(userOperation.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(userOperation.maxPriorityFeePerGas),
    paymasterVerificationGasLimit: userOperation.paymasterVerificationGasLimit
      ? BigInt(userOperation.paymasterVerificationGasLimit)
      : undefined,
    paymasterPostOpGasLimit: userOperation.paymasterPostOpGasLimit
      ? BigInt(userOperation.paymasterPostOpGasLimit)
      : undefined,
    signature,
  };

  const userOpHash = await kernelClient.sendUserOperation(userOpWithBigInts);
  console.log(`[deploySmartAccount] UserOp hash: ${userOpHash}`);

  const receipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return receipt.receipt.transactionHash;
}

/**
 * Approves a session key by serializing the permission account with the user's signature.
 * This creates a serialized permission approval that can be stored and later deserialized
 * by the PKP signer to make transactions on behalf of the user.
 *
 * NOTE: This does NOT send a transaction. The permission plugin will be automatically
 * enabled on-chain when the PKP makes its first transaction using the permission account.
 */
async function approveSessionKeyWithSignature(
  userControllerAddress: Address,
  agentSignerAddress: Address,
  appId: number,
  signature: Hex,
): Promise<string> {
  const smartAccountPublicClient = getSmartAccountPublicClient();

  // Create fake signer with the pre-signed signature for typed data
  const fakeSigner = toAccount({
    address: userControllerAddress,
    async signMessage() {
      throw new Error('signMessage not supported');
    },
    async signTransaction() {
      throw new Error('signTransaction not supported');
    },
    async signTypedData() {
      return signature;
    },
  });

  const userEoaEcdsaValidator = await signerToEcdsaValidator(smartAccountPublicClient, {
    signer: fakeSigner as any,
    entryPoint: getEntryPoint('0.7'),
    kernelVersion: KERNEL_V3_3,
  });

  // Create empty agent signer account (address only, no signing capability needed)
  const emptyAgentSignerAccount = addressToEmptyAccount(agentSignerAddress);
  const emptyAgentSigner = await toECDSASigner({ signer: emptyAgentSignerAccount });

  const permissionPlugin = await toPermissionValidator(smartAccountPublicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: emptyAgentSigner,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_3,
  });

  const userEoaKernelAccount = await createKernelAccount(smartAccountPublicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: userEoaEcdsaValidator,
      regular: permissionPlugin,
    },
    kernelVersion: KERNEL_V3_3,
    index: deriveSmartAccountIndex(appId),
  });

  // Serialize the permission account with the user's signature
  // This creates a string that can be stored and later deserialized by the PKP
  const serializedPermissionAccount = await serializePermissionAccount(
    userEoaKernelAccount,
    undefined,
    signature,
  );

  return JSON.stringify(serializedPermissionAccount);
}
