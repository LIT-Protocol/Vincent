import type {
  BatchGeneratePrivateKeysParams,
  BatchGeneratePrivateKeysResult,
  BatchGeneratePrivateKeysActionResult,
} from '../types';

import { batchGenerateKeysWithLitAction } from '../lit-actions-client';
import { getLitActionCommonCid } from '../lit-actions-client/utils';
import { storePrivateKeyBatch } from '../service-client';
import { getKeyTypeFromNetwork, getVincentRegistryAccessControlCondition } from './utils';

/**
 * Generates multiple random private keys inside a Lit Action for Vincent delegators,
 * and persists the keys and their metadata to the Vincent wrapped keys service.
 *
 * This function requires both session signatures (for Lit network authentication) and
 * a JWT token (for Vincent service authentication). All keys will be encrypted with
 * access control conditions that validate Vincent delegatee authorization.
 *
 * @param { BatchGeneratePrivateKeysParams } params Parameters to use for generating keys and optionally signing messages
 *
 * @returns { Promise<BatchGeneratePrivateKeysResult> } - The generated keys and, optionally, signed messages
 */
export async function batchGeneratePrivateKeys(
  params: BatchGeneratePrivateKeysParams,
): Promise<BatchGeneratePrivateKeysResult> {
  const { jwtToken, delegatorAddress, litNodeClient } = params;

  const allowDelegateeToDecrypt = await getVincentRegistryAccessControlCondition({
    delegatorAddress,
  });

  const litActionIpfsCid = getLitActionCommonCid('batchGenerateEncryptedKeys');

  const actionResults = await batchGenerateKeysWithLitAction({
    ...params,
    litActionIpfsCid,
    accessControlConditions: [allowDelegateeToDecrypt],
  });

  const keyParamsBatch = actionResults.map((keyData) => {
    const { generateEncryptedPrivateKey } = keyData;
    return {
      ...generateEncryptedPrivateKey,
      keyType: getKeyTypeFromNetwork('solana'),
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
    const id = ids[index]; // Result of writes is in same order as provided

    const signature = actionResult.signMessage?.signature;

    return {
      ...(signature ? { signMessage: { signature } } : {}),
      generateEncryptedPrivateKey: {
        memo,
        id,
        generatedPublicKey: publicKey,
        delegatorAddress,
      },
    };
  });

  return { delegatorAddress, results };
}
