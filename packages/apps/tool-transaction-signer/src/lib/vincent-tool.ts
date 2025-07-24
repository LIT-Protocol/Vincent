import { ethers } from 'ethers';
import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-contract-whitelist';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  toolParamsSchema,
} from './schemas';
import { signTx } from './lit-action-helpers/sign-tx';

const ContractWhitelistPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    serializedTransaction: 'serializedTransaction',
  },
});

export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/vincent-tool-transaction-signer' as const,
  toolDescription: 'Sign a transaction using a Vincent Agent Wallet.' as const,
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([ContractWhitelistPolicy]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed, fail }) => {
    const { serializedTransaction } = toolParams;

    try {
      // Try to parse the serialized transaction
      const transaction = ethers.utils.parseTransaction(serializedTransaction);

      return succeed({
        deserializedUnsignedTransaction: {
          to: transaction.to,
          nonce: transaction.nonce,
          gasLimit: transaction.gasLimit.toHexString(),
          gasPrice: transaction.gasPrice?.toHexString(),
          data: transaction.data,
          value: transaction.value.toHexString(),
          chainId: transaction.chainId,
          type: transaction.type ?? undefined,
          accessList: transaction.accessList,
          maxPriorityFeePerGas: transaction.maxPriorityFeePerGas?.toHexString(),
          maxFeePerGas: transaction.maxFeePerGas?.toHexString(),
        },
      });
    } catch (error) {
      return fail({
        error: `Failed to decode transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
  execute: async ({ toolParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { serializedTransaction } = toolParams;
    const { publicKey } = delegatorPkpInfo;

    try {
      const transaction = ethers.utils.parseTransaction(serializedTransaction);

      const txToSign: ethers.Transaction = {
        to: transaction.to,
        nonce: transaction.nonce,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        data: transaction.data,
        value: transaction.value,
        chainId: transaction.chainId,
      };

      // Only include optional properties if they are defined
      if (transaction.type !== null && transaction.type !== undefined) {
        txToSign.type = transaction.type;
      }
      if (transaction.accessList !== undefined) {
        txToSign.accessList = transaction.accessList;
      }
      if (transaction.maxPriorityFeePerGas !== undefined) {
        txToSign.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
      }
      if (transaction.maxFeePerGas !== undefined) {
        txToSign.maxFeePerGas = transaction.maxFeePerGas;
      }

      const signedTransaction = await signTx(publicKey, txToSign, 'serializedTxSignature');
      console.log('signedTransaction', signedTransaction);

      const parsedSignedTx = ethers.utils.parseTransaction(signedTransaction);

      return succeed({
        signedTransaction,
        deserializedSignedTransaction: {
          hash: parsedSignedTx.hash,

          to: parsedSignedTx.to,
          from: parsedSignedTx.from,
          nonce: parsedSignedTx.nonce,

          gasLimit: parsedSignedTx.gasLimit.toHexString(),
          gasPrice: parsedSignedTx.gasPrice?.toHexString(),

          data: parsedSignedTx.data,
          value: parsedSignedTx.value.toHexString(),
          chainId: parsedSignedTx.chainId,

          v: parsedSignedTx.v,
          r: parsedSignedTx.r,
          s: parsedSignedTx.s,

          type: parsedSignedTx.type ?? undefined,

          accessList: parsedSignedTx.accessList,

          maxPriorityFeePerGas: parsedSignedTx.maxPriorityFeePerGas?.toHexString(),
          maxFeePerGas: parsedSignedTx.maxFeePerGas?.toHexString(),
        },
      });
    } catch (error) {
      return fail({
        error: `Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
