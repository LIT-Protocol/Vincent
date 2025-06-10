import { ethers } from 'ethers';
import {
  checkNativeTokenBalance,
  checkVincentApp,
  createVincentApp,
  createVincentAppVersion,
  getEnv,
  VincentToolMetadata,
} from '../helper-funcs';
import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';

export const handleVincentApp = async ({
  vincentTools,
}: {
  vincentTools: VincentToolMetadata[];
}) => {
  const { appId, appVersion, createdNewApp } = await getVincentAppOrCreate({ vincentTools });

  const vincentAppInfoString = [
    createdNewApp
      ? 'ℹ️  Created new Vincent App. Set the following environment variables to use this Vincent App:'
      : `ℹ️  Using existing Vincent App:`,
    `TEST_VINCENT_APP_ID=${appId}`,
    `TEST_VINCENT_APP_VERSION=${appVersion}`,
  ]
    .filter(Boolean)
    .join('\n');
  console.log(vincentAppInfoString);

  return { appId, appVersion, createdNewApp };
};

export const getVincentAppInfoFromEnv = async () => {
  const VINCENT_APP_ID = getEnv('TEST_VINCENT_APP_ID');
  const VINCENT_APP_VERSION = getEnv('TEST_VINCENT_APP_VERSION');

  // If one is set, the other must be set
  if (
    (VINCENT_APP_ID === undefined && VINCENT_APP_VERSION !== undefined) ||
    (VINCENT_APP_ID !== undefined && VINCENT_APP_VERSION === undefined)
  ) {
    console.error(
      VINCENT_APP_ID === undefined
        ? '❌ TEST_VINCENT_APP_ID environment variable is not set. Please set it to the ID of the test Vincent App.'
        : '❌ TEST_VINCENT_APP_VERSION environment variable is not set. Please set it to the version of the test Vincent App.',
    );
    process.exit(1);
  }

  return {
    appId: VINCENT_APP_ID === undefined ? undefined : Number(VINCENT_APP_ID),
    appVersion: VINCENT_APP_VERSION === undefined ? undefined : Number(VINCENT_APP_VERSION),
  };
};

interface GetVincentAppOrCreateResponse {
  appId: number;
  appVersion: number;
  createdNewApp: boolean;
  createdNewAppVersion: boolean;
}
const getVincentAppOrCreate = async ({
  vincentTools,
}: {
  vincentTools: VincentToolMetadata[];
}): Promise<GetVincentAppOrCreateResponse> => {
  const { appId: _appId, appVersion: _appVersion } = await getVincentAppInfoFromEnv();

  if (_appId !== undefined && _appVersion !== undefined) {
    return await handleExistingVincentApp({
      appId: _appId,
      appVersion: _appVersion,
      vincentTools,
    });
  }

  return createNewVincentApp({ vincentTools });
};

const handleExistingVincentApp = async ({
  appId,
  appVersion,
  vincentTools,
}: {
  appId: number;
  appVersion: number;
  vincentTools: VincentToolMetadata[];
}) => {
  const { allRequirementsAvailable, allToolsAndPoliciesAvailable, missingTools, missingPolicies } =
    await checkVincentApp({
      appId,
      appVersion,
      vincentTools,
      vincentAppDelegatees: [],
    });

  if (allRequirementsAvailable) {
    return {
      appId,
      appVersion,
      createdNewApp: false,
      createdNewAppVersion: false,
    };
  } else {
    console.error('❌ Existing Vincent App is missing required tools and/or policies:');

    const response: GetVincentAppOrCreateResponse = {
      appId,
      appVersion,
      createdNewApp: false,
      createdNewAppVersion: false,
    };

    if (missingTools.length > 0) {
      console.error('Missing tools:');
      missingTools.forEach((toolIpfsCid) => {
        console.error(`  - ${toolIpfsCid}`);
      });
    }
    if (missingPolicies.length > 0) {
      console.error('Missing policies:');
      missingPolicies.forEach(({ toolIpfsCid, policyIpfsCid }) => {
        console.error(`  - Policy ${policyIpfsCid} for tool ${toolIpfsCid}`);
      });
    }

    if (!allToolsAndPoliciesAvailable) {
      console.error('⚠️  Tools or policies are missing. Creating a new app version...');
      const { appVersion } = await createVincentAppVersion({
        appId,
        vincentTools,
      });

      response.appId = appId;
      response.appVersion = appVersion;
      response.createdNewAppVersion = true;
    }

    return response;
  }
};

const createNewVincentApp = async ({ vincentTools }: { vincentTools: VincentToolMetadata[] }) => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    console.error(
      '❌ VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.',
    );
    process.exit(1);
  }

  const TEST_VINCENT_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_MANAGER_PRIVATE_KEY');
  if (TEST_VINCENT_APP_MANAGER_PRIVATE_KEY === undefined) {
    console.error(
      `❌ TEST_VINCENT_APP_MANAGER_PRIVATE_KEY environment variable is not set. Please set it to the private key that will be used to create the test Vincent App.`,
    );
    process.exit(1);
  }
  const vincentAppManagerEthersWallet = new ethers.Wallet(TEST_VINCENT_APP_MANAGER_PRIVATE_KEY);

  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const { balance, hasMinBalance } = await checkNativeTokenBalance({
    ethAddress: vincentAppManagerEthersWallet.address,
    rpcUrl: RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
    minBalance: MIN_ETH_BALANCE,
  });
  if (!hasMinBalance) {
    console.error(
      `❌ App Manager (${vincentAppManagerEthersWallet.address}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} ETH on the Lit Datil network. Current balance is ${ethers.utils.formatEther(balance)} ETH. Please fund the App Manager before continuing using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/.`,
    );
    process.exit(1);
  }

  const vincentAppInfo = await createVincentApp({
    vincentAddress: VINCENT_ADDRESS,
    vincentAppManagerEthersWallet,
    vincentTools,
    vincentAppDelegatees: [],
  });
  return {
    ...vincentAppInfo,
    createdNewApp: true,
    createdNewAppVersion: false,
  };
};
