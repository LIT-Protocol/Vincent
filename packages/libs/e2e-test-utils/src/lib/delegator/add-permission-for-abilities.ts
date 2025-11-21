import type { Signer, Wallet } from 'ethers';

import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';

import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';

// The LIT network requires that abilities be permitted for the Agent PKP to execute Lit Actions.
// This is part of the PKP ecosystem and is managed independently of the Vincent Delegation contract.
// The Platform User PKP wallet is used to add these permissions to the Agent PKP.
export const addPermissionForAbilities = async (
  wallet: Signer,
  pkpTokenId: string,
  abilityIpfsCids: string[],
) => {
  const litContractClient = await getLitContractsClient({ wallet: wallet as Wallet });

  for (const ipfsCid of abilityIpfsCids) {
    console.log(
      `Permitting ability: ${ipfsCid} with ability to sign on behalf of Agent PKP ${pkpTokenId}`,
    );

    await litContractClient.addPermittedAction({
      pkpTokenId,
      ipfsId: ipfsCid,
      authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
    });
  }
};
