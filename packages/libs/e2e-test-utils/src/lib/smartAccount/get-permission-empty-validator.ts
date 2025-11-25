import { toPermissionValidator } from '@zerodev/permissions';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { addressToEmptyAccount } from '@zerodev/sdk';
import { type Address } from 'viem';

import { publicClient } from '../environment/base';
import { entryPoint, kernelVersion } from '../environment/zerodev';

export async function getPermissionEmptyValidator(permittedAddress: Address) {
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
