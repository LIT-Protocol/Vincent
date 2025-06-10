import { ethers } from 'ethers';

import { getEnvOrExitProcess } from '../utils/get-env-or-exit-process.js';
import { createVincentApp } from './helpers/create-vincent-app.js';
import { getVincentAppFromEnv } from './helpers/get-vincent-app-from-env.ts';
import { VincentAppToolsWithPolicies } from './types';

export const setupDevVincentApp = async ({
  vincentAppToolsWithPolicies,
}: {
  vincentAppToolsWithPolicies: VincentAppToolsWithPolicies[];
}) => {
  const { appId, appVersion } = await getVincentAppFromEnv();

  if (appId === undefined || appVersion === undefined) {
    return await _createVincentApp({ vincentAppToolsWithPolicies });
  } else {
    // check vincent app for missing tools and policies
  }
};

const _createVincentApp = async ({
  vincentAppToolsWithPolicies,
}: {
  vincentAppToolsWithPolicies: VincentAppToolsWithPolicies[];
}) => {
  const vincentAddress = getEnvOrExitProcess({
    envName: 'VINCENT_ADDRESS',
    errorMessage: 'Please set it to the address of the Vincent contract.',
  });
  const vincentAppManagerPrivateKey = getEnvOrExitProcess({
    envName: 'TEST_VINCENT_APP_MANAGER_PRIVATE_KEY',
    errorMessage:
      'Please set it to the private key that will be used to create the test Vincent App.',
  });
  const vincentAppManagerEthersWallet = new ethers.Wallet(vincentAppManagerPrivateKey);

  const { appId: newAppId, appVersion: newAppVersion } = await createVincentApp({
    vincentAddress,
    vincentAppManagerEthersWallet,
    vincentAppToolsWithPolicies,
  });

  return {
    appId: newAppId,
    appVersion: newAppVersion,
  };
};

const _checkVincentAppForMissingToolsAndPolicies = async ({
  vincentAppToolsWithPolicies,
}: {
  vincentAppToolsWithPolicies: VincentAppToolsWithPolicies[];
}) => {
  console.log('WIP');
};
