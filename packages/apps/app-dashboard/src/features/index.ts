import Flags from './featureState.json';
import type { Features } from './features';

const getEnvironment = (): string => {
  if (typeof window !== 'undefined') {
    const url = window.location.href;
    const env = url.includes('vercel') ? 'STAGING' : 'PRODUCTION';
    return env;
  }
  return 'PRODUCTION';
};

const envVarName = 'VITE_NEW_DASHBOARD';
const detectedEnv = getEnvironment();

function getFeatureFlagsWithEnvironment(environment: string): Features {
  const featureState = Flags;

  if (typeof featureState !== 'object') {
    throw Error('invalid flags');
  }

  const { environments, features } = featureState;

  if (!Object.values(environments).includes(environment)) {
    throw Error(
      `invalid environment "${environment}", ${envVarName} must be set to one of:
      ${Object.values(environments).join(', ')}`,
    );
  }

  return new Proxy({} as Features, {
    get(_, flag) {
      if (flag === '__esModule') {
        return { value: true };
      }
      const flagName = String(flag);
      const feature = (features as any)[flagName];
      if (!feature) {
        throw Error(`invalid feature: "${flagName}"`);
      }
      const envEntry = feature[environment];
      if (!envEntry) {
        throw Error(`${flagName} missing definition for environment: "${environment}"`);
      }
      return envEntry.enabled;
    },
  });
}

const Features = getFeatureFlagsWithEnvironment(detectedEnv);

export { Features };
