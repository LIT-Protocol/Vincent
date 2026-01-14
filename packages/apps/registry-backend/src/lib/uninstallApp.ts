import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { ERC2771Type } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types/index.js';

import {
  COMBINED_ABI,
  deriveAgentAddress,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from '@lit-protocol/vincent-contracts-sdk';

import { getBaseChainId, getBasePublicClient } from './chainConfig';

const relaySdk = new GelatoRelay();

export async function uninstallApp(request: {
  appId: number;
  appVersion: number;
  userControllerAddress: string;
}) {
  const { appId, appVersion, userControllerAddress } = request;

  const basePublicClient = getBasePublicClient();

  const agentAddress = await deriveAgentAddress(basePublicClient, userControllerAddress, appId);

  const txData = COMBINED_ABI.encodeFunctionData('unPermitAppVersion', [
    agentAddress,
    appId,
    appVersion,
  ]);

  const dataToSign = await relaySdk.getDataToSignERC2771(
    {
      chainId: getBaseChainId() as unknown as bigint,
      target: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
      data: txData,
      user: userControllerAddress,
      isConcurrent: true,
    },
    ERC2771Type.ConcurrentSponsoredCall,
    basePublicClient as unknown as Parameters<typeof relaySdk.getDataToSignERC2771>[2],
  );

  console.log('[uninstallApp] Data to sign obtained successfully');

  return {
    uninstallDataToSign: dataToSign,
  };
}
