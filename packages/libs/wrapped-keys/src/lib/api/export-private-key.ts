import type { ExportPrivateKeyParams, ExportPrivateKeyResult } from '../types';

import { fetchPrivateKey } from '../service-client';
import { removeSaltFromDecryptedKey } from '../utils';

export const exportPrivateKey = async ({
  litNodeClient,
  delegatorSessionSigs,
  jwtToken,
  id,
  delegatorAddress,
}: ExportPrivateKeyParams): Promise<ExportPrivateKeyResult> => {
  const storedKeyMetadata = await fetchPrivateKey({
    delegatorAddress,
    id,
    jwtToken,
    litNetwork: litNodeClient.config.litNetwork,
  });

  const {
    ciphertext,
    dataToEncryptHash,
    evmContractConditions,
    publicKey,
    keyType,
    litNetwork,
    memo,
  } = storedKeyMetadata;

  const { decryptedData } = await litNodeClient.decrypt({
    sessionSigs: delegatorSessionSigs,
    ciphertext,
    dataToEncryptHash,
    evmContractConditions: JSON.parse(evmContractConditions),
    chain: 'ethereum',
  });

  return {
    decryptedPrivateKey: removeSaltFromDecryptedKey(new TextDecoder().decode(decryptedData)),
    delegatorAddress,
    id,
    publicKey,
    keyType,
    litNetwork,
    memo,
  };
};
