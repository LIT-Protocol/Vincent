import { ethers } from 'ethers';
import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-contract-whitelist';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import {
  buildTransactionForSigning,
  serializeTransactionForResponse,
  signTx,
} from './lit-action-helpers';

const ContractWhitelistPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: {
    serializedTransaction: 'serializedTransaction',
  },
});

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-transaction-signer' as const,
  abilityDescription: 'Sign a transaction using a Vincent Agent Wallet.' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([ContractWhitelistPolicy]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail }) => {
    const { serializedTransaction } = abilityParams;

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
  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { serializedTransaction } = abilityParams;
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
