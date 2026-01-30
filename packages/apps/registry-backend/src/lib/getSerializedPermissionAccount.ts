import type { Address } from 'viem';

import { getSmartAccountChain } from './chainConfig';
import { App } from './mongo/app';
import { UserAppInstallation } from './mongo/userAppInstallation';

export interface GetSerializedPermissionAccountParams {
  userControllerAddress: Address;
  appId: number;
}

export interface SerializedPermissionAccountResult {
  serializedPermissionAccount: string;
  agentSmartAccountAddress: Address;
  agentSignerAddress: Address;
  appVersion: number;
}

/**
 * Retrieves the serialized permission account for a user's app installation.
 * The serialized permission account contains the signed permission delegation
 * that allows the PKP to act as a validator on the smart account.
 *
 * This data is stored during the complete-installation flow and can be
 * retrieved later to avoid re-requesting signatures from the user.
 */
export async function getSerializedPermissionAccount(
  params: GetSerializedPermissionAccountParams,
): Promise<SerializedPermissionAccountResult> {
  const { userControllerAddress, appId } = params;

  console.log('[getSerializedPermissionAccount] Retrieving serialized permission account', {
    userControllerAddress,
    appId,
  });

  // Get the smart account chain ID
  const smartAccountChain = getSmartAccountChain();

  // Get the current active app version
  const app = await App.findOne({ appId, isDeleted: false });
  if (!app || app.activeVersion === undefined || app.activeVersion === null) {
    throw new Error(`App with id ${appId} not found or has no active version`);
  }

  // Query for the user's installation with the active version
  const installation = await UserAppInstallation.findOne({
    userControllerAddress: userControllerAddress.toLowerCase(),
    appId,
    appVersion: app.activeVersion,
    chainId: smartAccountChain.id,
  });

  if (!installation) {
    throw new Error(
      `No installation found for user ${userControllerAddress}, app ${appId}, version ${app.activeVersion}. ` +
        'Please call /user/:appId/complete-installation first to create the installation.',
    );
  }

  console.log('[getSerializedPermissionAccount] Found installation', {
    agentSmartAccountAddress: installation.agentSmartAccountAddress,
    agentSignerAddress: installation.agentSignerAddress,
    appVersion: installation.appVersion,
  });

  return {
    serializedPermissionAccount: installation.serializedPermissionAccount,
    agentSmartAccountAddress: installation.agentSmartAccountAddress as Address,
    agentSignerAddress: installation.agentSignerAddress as Address,
    appVersion: installation.appVersion,
  };
}
