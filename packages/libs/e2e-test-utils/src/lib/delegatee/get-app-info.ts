import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { getChainHelpers } from '../chain';

export async function getAppInfo() {
  const {
    wallets: { appDelegatee },
  } = await getChainHelpers();

  const app = await getClient({
    signer: appDelegatee,
  }).getAppByDelegateeAddress({
    delegateeAddress: appDelegatee.address,
  });

  if (!app) {
    return null;
  }

  const { id: appId, latestVersion: appVersion } = app;
  return { appId, appVersion };
}
