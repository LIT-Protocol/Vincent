import { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { Signer } from 'ethers';

import { LIT_ABILITY } from '@lit-protocol/constants';
import type { AuthSig, ILitResource } from '@lit-protocol/types';
import {
  createSiweMessage,
  generateAuthSig,
  LitAccessControlConditionResource,
} from '@lit-protocol/auth-helpers';

// delegator sessionsigs must allow decryption of access control condition restricted resources
export const getDelegatorSessionSigs = async ({
  litNodeClient,
  ethersSigner,
  capacityDelegationAuthSig,
}: {
  litNodeClient: LitNodeClient;
  ethersSigner: Signer;
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
