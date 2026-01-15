import type { Address, Chain, Hex } from 'viem';

import { submitSignedUserOp } from '@lit-protocol/vincent-ability-relay-link';

export async function submitUserOp(params: {
  agentAddress: Address;
  serializedPermissionAccount: string;
  userOpSignature: Hex;
  userOp: Record<string, unknown>;
  chain: Chain;
  zerodevRpcUrl: string;
}) {
  const {
    agentAddress,
    serializedPermissionAccount,
    userOpSignature,
    userOp,
    chain,
    zerodevRpcUrl,
  } = params;

  return submitSignedUserOp({
    permittedAddress: agentAddress,
    serializedPermissionAccount,
    userOpSignature,
    userOp,
    chain,
    zerodevRpcUrl,
  });
}
