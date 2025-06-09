import {
  addVincentAppDelegatee,
  checkVincentApp,
  createVincentApp,
  createVincentAppVersion,
  getEnv,
  VincentToolMetadata,
} from '../helper-funcs';

export const handleVincentApp = async ({
  vincentTools,
  vincentAppDelegatees,
}: {
  vincentTools: VincentToolMetadata[];
  vincentAppDelegatees: string[];
}) => {
  try {
    const { appId, appVersion, createdNewApp } = await getVincentAppOrCreate({
      vincentTools,
      vincentAppDelegatees,
    });

    const vincentAppInfoString = [
      createdNewApp
        ? 'Created new Vincent App. Set the following environment variables to use this Vincent App:'
        : `Using existing Vincent App:`,
      `TEST_VINCENT_APP_ID=${appId}`,
      `TEST_VINCENT_APP_VERSION=${appVersion}`,
    ]
      .filter(Boolean)
      .join('\n');

    console.log(vincentAppInfoString);

    return { appId, appVersion, createdNewApp };
  } catch (error) {
    console.error(
      `There was an error when trying to retrieve the Agent Wallet PKP info:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }
};

interface GetVincentAppOrCreateResponse {
  appId: number;
  appVersion: number;
  createdNewApp: boolean;
  createdNewAppVersion: boolean;
}
const getVincentAppOrCreate = async ({
  vincentTools,
  vincentAppDelegatees,
}: {
  vincentTools: VincentToolMetadata[];
  vincentAppDelegatees: string[];
}): Promise<GetVincentAppOrCreateResponse> => {
  const VINCENT_APP_ID = getEnv('TEST_VINCENT_APP_ID');
  const VINCENT_APP_VERSION = getEnv('TEST_VINCENT_APP_VERSION');

  if (VINCENT_APP_ID !== undefined && VINCENT_APP_VERSION !== undefined) {
    const {
      allRequirementsAvailable,
      allToolsAndPoliciesAvailable,
      allDelegateesAvailable,
      missingTools,
      missingPolicies,
      missingDelegatees,
    } = await checkVincentApp({
      appId: Number(VINCENT_APP_ID),
      appVersion: Number(VINCENT_APP_VERSION),
      vincentTools,
      vincentAppDelegatees,
    });

    if (allRequirementsAvailable) {
      return {
        appId: Number(VINCENT_APP_ID),
        appVersion: Number(VINCENT_APP_VERSION),
        createdNewApp: false,
        createdNewAppVersion: false,
      };
    } else {
      console.error('Existing Vincent App is missing required tools, policies, or delegatees:');

      const response: GetVincentAppOrCreateResponse = {
        appId: Number(VINCENT_APP_ID),
        appVersion: Number(VINCENT_APP_VERSION),
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
      if (missingDelegatees.length > 0) {
        console.error('Missing delegatees:');
        missingDelegatees.forEach((delegatee) => {
          console.error(`  - ${delegatee}`);
        });
      }

      if (!allToolsAndPoliciesAvailable) {
        console.error('Tools or policies are missing. Creating a new app version...');
        const { appId, appVersion } = await createVincentAppVersion({
          appId: Number(VINCENT_APP_ID),
          vincentTools,
        });

        response.appId = appId;
        response.appVersion = appVersion;
        response.createdNewAppVersion = true;
      }

      if (!allDelegateesAvailable) {
        console.error('Delegatees are missing. Adding missing delegatees...');

        for (const delegatee of missingDelegatees) {
          const { delegateeAddress, txHash } = await addVincentAppDelegatee({
            appId: Number(VINCENT_APP_ID),
            delegateeAddress: delegatee,
          });
          console.log(
            `Added delegatee ${delegateeAddress} to app ${VINCENT_APP_ID} with tx hash ${txHash}`,
          );
        }
      }

      return response;
    }
  }

  // If one is set, the other must be set
  if (
    (VINCENT_APP_ID === undefined && VINCENT_APP_VERSION !== undefined) ||
    (VINCENT_APP_ID !== undefined && VINCENT_APP_VERSION === undefined)
  ) {
    console.error(
      VINCENT_APP_ID === undefined
        ? 'TEST_VINCENT_APP_ID environment variable is not set. Please set it to the ID of the test Vincent App.'
        : 'TEST_VINCENT_APP_VERSION environment variable is not set. Please set it to the version of the test Vincent App.',
    );
    process.exit(1);
  }

  const vincentAppInfo = await createVincentApp({ vincentTools, vincentAppDelegatees });
  return {
    ...vincentAppInfo,
    createdNewApp: true,
    createdNewAppVersion: false,
  };
};
