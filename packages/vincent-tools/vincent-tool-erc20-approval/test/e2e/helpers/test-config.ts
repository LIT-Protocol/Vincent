import fs from 'fs';

export interface TestConfig {
  appId: string | null;
  appVersion: string | null;
  userPkp:
    | {
        tokenId: string | null;
        ethAddress: string | null;
        pkpPubkey: string | null;
      }
    | undefined;
}

export const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

export const getTestConfig = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(
      `ℹ️  Loaded existing App ID: ${config.appId}, App Version: ${config.appVersion}, User PKP: ${JSON.stringify(config.userPkp, null, 2)}`,
    );
    return config;
  } else {
    console.log('ℹ️  No existing test config found, initializing with default values');
    const defaultConfig = {
      appId: null,
      appVersion: null,
      userPkp: {
        tokenId: null,
        ethAddress: null,
        pkpPubkey: null,
      },
    };
    fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
};

export const saveTestConfig = (filePath: string, config: TestConfig) => {
  // Convert bigint values to strings for JSON serialization
  const serializableConfig = {
    ...config,
    appId: config.appId !== null ? config.appId.toString() : null,
    appVersion: config.appVersion !== null ? config.appVersion.toString() : null,
  };

  fs.writeFileSync(filePath, JSON.stringify(serializableConfig, null, 2));
  console.log(
    `ℹ️  Saved test config: App ID: ${config.appId}, App Version: ${config.appVersion}, User PKP: ${JSON.stringify(config.userPkp, null, 2)}`,
  );
};
