import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { GetDelegatorsAgentPkpsParams } from './types';

/** Get a (paginated) list of delegator agent addresses for a specific app version
 *
 * See documentation at {@link vincent-contracts-sdk!getDelegatedAgentAddresses | vincent-contracts-sdk/getDelegatedAgentAddresses}
 */
export async function getDelegatorsAgentPkpAddresses(params: GetDelegatorsAgentPkpsParams) {
  const { appId, appVersion, signer, offset } = params;

  const contractClient = getClient({ signer });
  return await contractClient.getDelegatedAgentAddresses({
    appId,
    version: appVersion,
    offset,
  });
}
