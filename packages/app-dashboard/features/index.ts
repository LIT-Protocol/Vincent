interface Feature {
  enabled: boolean;
  lastEditedBy: string;
  lastEditedAt: string;
}

interface FeatureDefinition {
  createdBy: string;
  createdAt: string;
  testnet: Feature;
  mainnet: Feature;
  [key: string]: any;
}

interface FeatureFlags {
  [key: string]: boolean;
}

interface FlagState {
  [key: string]: FeatureDefinition;
}

interface Environments {
  [key: string]: string;
}

interface InitOptions {
  flagState: FlagState;
  currentEnvironment: string;
  environments: Environments;
}

export function initFeatureFlags({
  flagState,
  currentEnvironment,
  environments,
}: InitOptions): FeatureFlags {
  if (typeof flagState !== 'object') {
    throw Error('invalid flags');
  }

  if (!Object.values(environments).includes(currentEnvironment)) {
    throw Error(`
invalid environment "${currentEnvironment}", the VITE_VINCENT_ENV environment variable must be set to one of:
${Object.values(environments).join(', ')}
      `);
  }

  return new Proxy({} as FeatureFlags, {
    get(_target, flag: string) {
      if (flag === '__esModule') {
        return { value: true };
      }

      const feature = flagState[flag];
      if (!feature) {
        throw Error(`invalid feature: "${flag}"`);
      }

      if (!feature[currentEnvironment]) {
        throw Error(`${flag} missing definition for environment: "${currentEnvironment}"`);
      }

      return feature[currentEnvironment].enabled;
    },
  });
}
