import { createVincentApp, getEnv, VincentToolMetadata } from '../helper-funcs';

export const handleVincentApp = async ({
  vincentTools,
}: {
  vincentTools: VincentToolMetadata[];
}) => {
  try {
    const { appId, appVersion, createdNewApp } = await getVincentAppOrCreate({ vincentTools });

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

const getVincentAppOrCreate = async ({ vincentTools }: { vincentTools: VincentToolMetadata[] }) => {
  const VINCENT_APP_ID = getEnv('TEST_VINCENT_APP_ID');
  const VINCENT_APP_VERSION = getEnv('TEST_VINCENT_APP_VERSION');

  if (VINCENT_APP_ID !== undefined && VINCENT_APP_VERSION !== undefined) {
    return {
      appId: VINCENT_APP_ID,
      appVersion: VINCENT_APP_VERSION,
      createdNewApp: false,
    };
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

  const vincentAppInfo = await createVincentApp({ vincentTools });
  return {
    ...vincentAppInfo,
    createdNewApp: true,
  };
};
