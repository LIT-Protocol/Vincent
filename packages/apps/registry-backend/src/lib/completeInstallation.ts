import type { ConcurrentPayloadToSign } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types';

import { completeRelayTransaction } from './completeRelayTransaction';

export async function completeInstallation(request: {
  typedDataSignature: string;
  appInstallationDataToSign: ConcurrentPayloadToSign;
}) {
  return completeRelayTransaction({
    typedDataSignature: request.typedDataSignature,
    dataToSign: request.appInstallationDataToSign,
    operationName: 'completeInstallation',
  });
}
