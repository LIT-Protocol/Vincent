import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { PkpInfo } from '../mint-new-pkp';

import { getChainHelpers } from '../chain';

/**
 * Adds Vincent delegation permission for a specific app version for the user's Agent Wallet PKP.
 *
 * This function will check if the requested app version is already permitted. If it is,
 * it will skip the permission step and return early. If a different version is permitted,
 * it will remove the old permission before adding the new one.
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
    wallets: { platformUserPkpOwner },
  } = await getChainHelpers();

  const client = getClient({
    signer: platformUserPkpOwner,
  });

  const existingPermittedAppVersion = await client.getPermittedAppVersionForPkp({
    pkpEthAddress: agentPkpInfo.ethAddress,
    appId,
  });

  // Check if the requested version is already permitted
  if (existingPermittedAppVersion === appVersion) {
    console.log(
      `App version ${appVersion} is already permitted for Agent Wallet PKP ${agentPkpInfo.ethAddress}. Skipping permission.`,
    );
    return;
  }

  // If a different version is permitted, remove it first
  if (existingPermittedAppVersion) {
    console.log(`Removing existing permission for app version ${existingPermittedAppVersion}`);
    await client.unPermitApp({
      pkpEthAddress: agentPkpInfo.ethAddress,
      appId,
      appVersion: existingPermittedAppVersion,
    });
  }

  // Permit the new version
  const result = await client.permitApp({
    pkpEthAddress: agentPkpInfo.ethAddress,
    appId,
    appVersion,
    permissionData: permissionData,
  });

  console.log(
    `Permitted App with ID ${appId} and version ${appVersion} for Agent Wallet PKP ${agentPkpInfo.ethAddress}\nTx hash: ${result.txHash}`,
  );
}
