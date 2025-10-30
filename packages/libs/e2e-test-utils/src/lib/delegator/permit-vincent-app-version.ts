import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { PkpInfo } from '../mint-new-pkp';

import { getChainHelpers } from '../chain';

/**
 * Adds Vincent delegation permission for a specific app version for the user's Agent Wallet PKP
 */
export async function permitAppVersionForAgentWalletPkp({
  permissionData,
  appId,
  appVersion,
  agentPkpInfo,
}: {
  permissionData: PermissionData;
  appId: number;
  appVersion: number;
  agentPkpInfo: PkpInfo;
}): Promise<void> {
  const {
    wallets: { agentWalletOwner },
  } = await getChainHelpers();

  const existingPermittedAppVersion = await getClient({
    signer: agentWalletOwner,
  }).getPermittedAppVersionForPkp({
    pkpEthAddress: agentPkpInfo.ethAddress,
    appId,
  });

  if (existingPermittedAppVersion) {
    console.log(`Removing existing permission for app version ${existingPermittedAppVersion}`);
    await getClient({
      signer: agentWalletOwner,
    }).unPermitApp({
      pkpEthAddress: agentPkpInfo.ethAddress,
      appId,
      appVersion: existingPermittedAppVersion,
    });
  }

  const result = await getClient({
    signer: agentWalletOwner,
  }).permitApp({
    pkpEthAddress: agentPkpInfo.ethAddress,
    appId,
    appVersion,
    permissionData: permissionData,
  });

  console.log(
    `Permitted App with ID ${appId} and version ${appVersion} for Agent Wallet PKP ${agentPkpInfo.ethAddress}\nTx hash: ${result.txHash}`,
  );
}
