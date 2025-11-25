import { toPermissionValidator } from '@zerodev/permissions';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { addressToEmptyAccount } from '@zerodev/sdk';
import { type Address, type PublicClient } from 'viem';

import { entryPoint, kernelVersion } from '../environment/zerodev';

export async function getPermissionEmptyValidator(
  publicClient: PublicClient,
  permittedAddress: Address,
) {
  const permittedEmptyAccount = addressToEmptyAccount(permittedAddress);
  const permittedEmptySigner = await toECDSASigner({
    signer: permittedEmptyAccount,
  });
  return await toPermissionValidator(publicClient, {
    entryPoint,
    kernelVersion,
    signer: permittedEmptySigner,
    policies: [
      // This is kept simple since this is a simple development environment file.
      toSudoPolicy({}),
    ],
  });
}
