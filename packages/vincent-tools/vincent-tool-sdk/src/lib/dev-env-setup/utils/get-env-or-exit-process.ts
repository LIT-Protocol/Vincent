import { getEnv } from 'src/lib/helper-funcs/get-env';

export const getEnvOrExitProcess = ({
  envName,
  errorMessage,
}: {
  envName: string;
  errorMessage: string;
}) => {
  const env = getEnv(envName);
  if (env === undefined) {
    console.error(`❌ ${envName} environment variable is not set. ${errorMessage}`);
    process.exit(1);
  }
  return env;
};
