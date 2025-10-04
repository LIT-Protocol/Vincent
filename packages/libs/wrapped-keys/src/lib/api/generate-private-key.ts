import type { GeneratePrivateKeyParams, GeneratePrivateKeyResult } from '../types';

import { generateKeyWithLitAction } from '../lit-actions-client';
import { getLitActionCid } from '../lit-actions-client/utils';
import { storePrivateKey } from '../service-client';
import { getKeyTypeFromNetwork, getVincentRegistryAccessControlCondition } from './utils';

/**
 * Generates a random private key inside a Lit Action for Vincent delegators,
 * and persists the key and its metadata to the Vincent wrapped keys service.
 *
 * This function requires both session signatures (for Lit network authentication) and
 * a JWT token (for Vincent service authentication). The key will be encrypted with
 * access control conditions that validate Vincent delegatee authorization.
 *
 * @param { GeneratePrivateKeyParams } params - Required parameters to generate the private key
 *
 * @returns { Promise<GeneratePrivateKeyResult> } - The publicKey of the generated random private key and the Vincent delegator Address associated with the Wrapped Key
 */
export async function generatePrivateKey(
  params: GeneratePrivateKeyParams,
): Promise<GeneratePrivateKeyResult> {
  const { delegatorAddress, jwtToken, network, litNodeClient, memo } = params;

  const allowDelegateeToDecrypt = await getVincentRegistryAccessControlCondition({
    delegatorAddress,
  });

  const litActionIpfsCid = getLitActionCid(network, 'generateEncryptedKey');

  const { ciphertext, dataToEncryptHash, publicKey } = await generateKeyWithLitAction({
    ...params,
    litActionIpfsCid,
    accessControlConditions: [allowDelegateeToDecrypt],
  });

  const { id } = await storePrivateKey({
    jwtToken,
    storedKeyMetadata: {
      ciphertext,
      publicKey,
      keyType: getKeyTypeFromNetwork(network),
      dataToEncryptHash,
      memo,
    },
    litNetwork: litNodeClient.config.litNetwork,
  });

  return {
    delegatorAddress,
    id,
    generatedPublicKey: publicKey,
  };
}
