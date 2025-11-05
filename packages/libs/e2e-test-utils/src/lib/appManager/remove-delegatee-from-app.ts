import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { getChainHelpers } from '../chain';
import { getAppInfo } from '../delegatee/get-app-info';

/**
 * Removes a delegatee from an app
 */
export async function removeDelegateeFromApp() {
  const app = await getAppInfo();

  if (!app) {
    throw new Error('App was expected, but not found. Please register a new app first.');
  }

  const { appId } = app;

  const {
    wallets: { appManager, appDelegatee },
  } = await getChainHelpers();

  const { txHash } = await getClient({
    signer: appManager,
  }).removeDelegatee({
    appId,
    delegateeAddress: appDelegatee.address,
  });

  console.log(
    `Removed delegatee ${appDelegatee.address} from App with ID: ${appId}\nTx hash: ${txHash}`,
  );

  return { txHash };
}
