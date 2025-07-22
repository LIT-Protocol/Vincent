import { getDelegatedPkpEthAddresses } from '@lit-protocol/vincent-contracts-sdk';

import type { GetDelegatorsAgentPkpsParams } from './types';

/** Get a (paginated) list of delegator agent PKPs for a specific app version
 *
 * See documentation at {@link vincent-contracts-sdk!getDelegatedPkpEthAddresses | vincent-contracts-sdk/getDelegatedPkpEthAddresses}
 */
export async function getDelegatorsAgentPkpAddresses(params: GetDelegatorsAgentPkpsParams) {
  const { appId, appVersion, signer, pageOpts } = params;
  return await getDelegatedPkpEthAddresses({
    args: {
      appId,
      version: appVersion,
      pageOpts,
    },
    signer,
  });
}
