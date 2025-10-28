import type { Wallet } from 'ethers';

import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';

import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';

// The LIT network requires that abilities be permitted for the agent PKP to sign on behalf of the user's agent PKP.
// This is part of the PKP ecosystem and is managed independently of the Vincent Delegation contract
export const addPermissionForAbilities = async (
  wallet: Wallet,
  pkpTokenId: string,
  abilityIpfsCids: string[],
) => {
  const litContractClient = await getLitContractsClient({ wallet });

  for (const ipfsCid of abilityIpfsCids) {
    console.log(
      `Permitting ability: ${ipfsCid} with ability to sign on behalf of user's agent PKP ${pkpTokenId}`,
    );

    await litContractClient.addPermittedAction({
      pkpTokenId,
      ipfsId: ipfsCid,
      authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
    });
  }
};
