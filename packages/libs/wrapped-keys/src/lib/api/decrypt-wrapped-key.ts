import type { ethers } from 'ethers';

import type { AuthSig, ILitResource } from '@lit-protocol/types';

import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY, LIT_NETWORK } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

import { LIT_PREFIX } from '../constants';

export const decryptVincentWrappedKey = async ({
  ethersSigner,
  evmContractConditions,
  ciphertext,
  dataToEncryptHash,
  capacityDelegationAuthSig,
}: {
  ethersSigner: ethers.Signer;
  evmContractConditions: string;
  ciphertext: string;
  dataToEncryptHash: string;
  capacityDelegationAuthSig?: AuthSig;
}) => {
  const litNodeClient = new LitNodeClient({
    litNetwork: LIT_NETWORK.Datil,
    debug: true,
  });
  await litNodeClient.connect();

  const sessionSigs = await getSessionSigs({
    litNodeClient,
    ethersSigner,
    capacityDelegationAuthSig,
  });

  const { decryptedData } = await litNodeClient.decrypt({
    sessionSigs,
    ciphertext,
    dataToEncryptHash,
    evmContractConditions: JSON.parse(evmContractConditions),
    chain: 'ethereum',
  });

  const decryptedString = new TextDecoder().decode(decryptedData);
  return decryptedString.replace(LIT_PREFIX, '');
};

const getSessionSigs = async ({
  litNodeClient,
  ethersSigner,
  capacityDelegationAuthSig,
}: {
  litNodeClient: LitNodeClient;
  ethersSigner: ethers.Signer;
  capacityDelegationAuthSig?: AuthSig;
}) => {
  return litNodeClient.getSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 2).toISOString(), // 2 minutes
    capabilityAuthSigs: capacityDelegationAuthSig ? [capacityDelegationAuthSig] : [],
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*') as ILitResource,
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        // @ts-expect-error Typing issue, not detecting it's correctly LitResourceAbilityRequest[]
        resources: resourceAbilityRequests,
        walletAddress: await ethersSigner.getAddress(),
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient: litNodeClient,
      });

      return await generateAuthSig({
        signer: ethersSigner,
        toSign,
      });
    },
  });
};
