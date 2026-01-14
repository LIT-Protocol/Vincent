import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { PkpInfo } from '../mint-new-pkp';

/**
 * Adds Vincent delegation permission for a specific app version for the Agent PKP.
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
  platformUserPkpWallet,
  agentAddress,
}: {
  permissionData: PermissionData;
  appId: number;
  appVersion: number;
  agentPkpInfo: PkpInfo;
  platformUserPkpWallet: PKPEthersWallet;
  agentAddress: string;
}): Promise<void> {
  const client = getClient({
    signer: platformUserPkpWallet,
  });

  const [permittedAppResult] = await client.getPermittedAppForAgents({
    agentAddresses: [agentAddress],
  });
  const existingPermittedApp = permittedAppResult?.permittedApp ?? null;

  // Check if the requested version is already permitted
  if (existingPermittedApp?.appId === appId && existingPermittedApp.version === appVersion) {
    console.log(
      `App version ${appVersion} is already permitted for Agent ${agentAddress}. Skipping permission.`,
    );
    return;
  }

  // If a different version (or app) is permitted, remove it first
  if (existingPermittedApp) {
    console.log(
      `Removing existing permission for app ${existingPermittedApp.appId} version ${existingPermittedApp.version}`,
    );
    await client.unPermitApp({
      agentAddress,
      appId: existingPermittedApp.appId,
      appVersion: existingPermittedApp.version,
    });
  }

  // Permit the new version
  const result = await client.permitApp({
    agentAddress,
    pkpSigner: agentPkpInfo.ethAddress,
    pkpSignerPubKey: agentPkpInfo.publicKey,
    appId,
    appVersion,
    permissionData: permissionData,
  });

  console.log(
    `Permitted App with ID ${appId} and version ${appVersion} for Agent ${agentAddress}\nTx hash: ${result.txHash}`,
  );
}
