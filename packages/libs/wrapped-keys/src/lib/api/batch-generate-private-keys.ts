import { getVincentWrappedKeysAccs } from '@lit-protocol/vincent-contracts-sdk';
import * as util from 'node:util';

import type {
  BatchGeneratePrivateKeysParams,
  BatchGeneratePrivateKeysResult,
  BatchGeneratePrivateKeysActionResult,
} from '../types';

import { batchGenerateKeysWithLitAction } from '../lit-actions-client';
import { getLitActionCommonCid } from '../lit-actions-client/utils';
import { storePrivateKeyBatch } from '../service-client';
import { getKeyTypeFromNetwork } from './utils';

/**
 * Generates multiple random private keys inside a Lit Action for Vincent delegators,
 * and persists the keys and their metadata to the Vincent wrapped keys service.
 *
 * This function requires both session signatures (for Lit network authentication) and
 * a JWT token (for Vincent service authentication). All keys will be encrypted with
 * access control conditions that validate Vincent delegatee authorization.
 *
 * @param { BatchGeneratePrivateKeysParams } params Parameters to use for generating keys
 *
 * @returns { Promise<BatchGeneratePrivateKeysResult> } - The generated keys
 */
export async function batchGeneratePrivateKeys(
  params: BatchGeneratePrivateKeysParams,
): Promise<BatchGeneratePrivateKeysResult> {
  const { jwtToken, delegatorAddress, litNodeClient } = params;

  const vincentWrappedKeysAccs = await getVincentWrappedKeysAccs({
    delegatorAddress,
  });

  const litActionIpfsCid = getLitActionCommonCid('batchGenerateEncryptedKeys');

  const actionResults = await batchGenerateKeysWithLitAction({
    ...params,
    litActionIpfsCid,
    evmContractConditions: vincentWrappedKeysAccs,
  });

  console.log(
    'batchGeneratePrivateKeys actionResults',
    util.inspect(actionResults, false, null, true /* enable colors */),
  );

  const keyParamsBatch = actionResults.map((keyData, index) => {
    const { generateEncryptedPrivateKey } = keyData;
    return {
      ...generateEncryptedPrivateKey,
      keyType: getKeyTypeFromNetwork('solana'),
      delegatorAddress,
      evmContractConditions: JSON.stringify(
        actionResults[index].generateEncryptedPrivateKey.evmContractConditions,
      ),
    };
  });

  const { ids } = await storePrivateKeyBatch({
    jwtToken,
    storedKeyMetadataBatch: keyParamsBatch,
    litNetwork: litNodeClient.config.litNetwork,
  });

  const results = actionResults.map((actionResult, index): BatchGeneratePrivateKeysActionResult => {
    const {
      generateEncryptedPrivateKey: { memo, publicKey },
    } = actionResult;
    const id = ids[index]; // Result of writes is returned in the same order as provided

    return {
      generateEncryptedPrivateKey: {
        delegatorAddress,
        memo,
        id,
        generatedPublicKey: publicKey,
      },
    };
  });

  return { delegatorAddress, results };
}
