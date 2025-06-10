import { getEnv } from 'src/lib/helper-funcs/get-env';

export const getVincentAppFromEnv = async (): Promise<
  { appId: undefined; appVersion: undefined } | { appId: number; appVersion: number }
> => {
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

  if (VINCENT_APP_ID === undefined && VINCENT_APP_VERSION === undefined) {
    return {
      appId: undefined,
      appVersion: undefined,
    };
  }

  return {
    appId: Number(VINCENT_APP_ID),
    appVersion: Number(VINCENT_APP_VERSION),
  };
};
