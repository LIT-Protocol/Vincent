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
import {
  buildTransactionForSigning,
  serializeTransactionForResponse,
  signTx,
} from './lit-action-helpers';

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
      return succeed({
        deserializedUnsignedTransaction: serializeTransactionForResponse(
          // Try to parse the serialized transaction
          ethers.utils.parseTransaction(serializedTransaction),
        ),
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
      const signedTransaction = await signTx(
        publicKey,
        buildTransactionForSigning(transaction),
        'serializedTxSignature',
      );
      const parsedSignedTx = ethers.utils.parseTransaction(signedTransaction);

      const deserializedSignedTransaction = serializeTransactionForResponse(transaction, {
        hash: parsedSignedTx.hash as string,
        from: parsedSignedTx.from as string,
        v: parsedSignedTx.v as number,
        r: parsedSignedTx.r as string,
        s: parsedSignedTx.s as string,
      });

      return succeed({
        signedTransaction,
        deserializedSignedTransaction,
      });
    } catch (error) {
      return fail({
        error: `Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
