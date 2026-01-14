import { getVincentWrappedKeysAccs } from '@lit-protocol/vincent-contracts-sdk';

import type { GeneratePrivateKeyParams, GeneratePrivateKeyResult } from '../types';

import { generateKeyWithLitAction } from '../lit-actions-client';
import { getLitActionCid } from '../lit-actions-client/utils';
import { storePrivateKey } from '../service-client';
import { getKeyTypeFromNetwork } from './utils';

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
  const { delegatorAddress, agentAddress, jwtToken, network, litNodeClient, memo } = params;

  const vincentWrappedKeysAccs = await getVincentWrappedKeysAccs({
    delegatorPkpEthAddress: delegatorAddress,
    agentAddress,
  });

  const litActionIpfsCid = getLitActionCid(network, 'generateEncryptedKey');

  const { ciphertext, dataToEncryptHash, publicKey, evmContractConditions } =
    await generateKeyWithLitAction({
      ...params,
      litActionIpfsCid,
      evmContractConditions: vincentWrappedKeysAccs,
    });

  const { id } = await storePrivateKey({
    jwtToken,
    storedKeyMetadata: {
      ciphertext,
      publicKey,
      keyType: getKeyTypeFromNetwork(network),
      dataToEncryptHash,
      memo,
      delegatorAddress,
      evmContractConditions: JSON.stringify(evmContractConditions),
    },
    litNetwork: litNodeClient.config.litNetwork,
  });

  return {
    delegatorAddress,
    id,
    generatedPublicKey: publicKey,
  };
}
