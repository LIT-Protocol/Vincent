import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { ERC2771Type } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types/index.js';

import {
  COMBINED_ABI,
  deriveAgentAddress,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from '@lit-protocol/vincent-contracts-sdk';

import {
  getVincentRegistryChainId,
  getVincentRegistryPublicClient,
  getSmartAccountPublicClient,
} from './chainConfig';

const relaySdk = new GelatoRelay();

export async function uninstallApp(request: {
  appId: number;
  appVersion: number;
  userControllerAddress: string;
  sponsorGas?: boolean;
}) {
  const { appId, appVersion, userControllerAddress, sponsorGas = true } = request;

  // Derive agent address using smart account chain (where agent is deployed)
  const smartAccountPublicClient = getSmartAccountPublicClient();
  const agentAddress = await deriveAgentAddress(
    smartAccountPublicClient,
    userControllerAddress,
    appId,
  );
  const vincentRegistryPublicClient = getVincentRegistryPublicClient();

  const txData = COMBINED_ABI.encodeFunctionData('unPermitAppVersion', [
    agentAddress,
    appId,
    appVersion,
  ]);

  // If sponsorGas is false, return raw transaction for direct EOA submission
  if (!sponsorGas) {
    console.log('[uninstallApp] Returning raw transaction for direct submission');
    return {
      rawTransaction: {
        to: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
        data: txData,
      },
    };
  }

  const dataToSign = await relaySdk.getDataToSignERC2771(
    {
      chainId: getVincentRegistryChainId() as unknown as bigint,
      target: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
      data: txData,
      user: userControllerAddress,
      isConcurrent: true,
    },
    ERC2771Type.ConcurrentSponsoredCall,
    vincentRegistryPublicClient as unknown as Parameters<typeof relaySdk.getDataToSignERC2771>[2],
  );

  console.log('[uninstallApp] Data to sign obtained successfully');

  return {
    uninstallDataToSign: dataToSign,
  };
}
