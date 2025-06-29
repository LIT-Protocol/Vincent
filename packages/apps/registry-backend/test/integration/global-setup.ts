import { setup as setupDevServer } from 'jest-process-manager';
import { resolve } from 'path';
import { startMongoMemoryServer } from './mongodb-memory-server';

module.exports = async function globalSetup() {
  // Start MongoDB Memory Server
  const mongoUri = await startMongoMemoryServer();

  // Set environment variables for the dev server
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGO_DB_NAME = 'test';

  await setupDevServer({
    command: 'pnpm nx dev',
    launchTimeout: 30000,
    port: Number(process.env.PORT || 3000),
    options: {
      cwd: resolve(__dirname, '../../'),
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
        MONGO_DB_NAME: 'test',
        CORS_ALLOWED_DOMAIN: 'http://localhost:3000',
        EXPECTED_AUDIENCE: 'localhost',
        IS_DEVELOPMENT: '1',
        LIT_FEATURE_ENV: 'STAGING', // Enable hard deletes
      },
    },
    waitOnScheme: {
      delay: 1000,
    },
    usedPortAction: 'kill',
    debug: true,
  });

  console.log('Test server started with in-memory MongoDB');
};
