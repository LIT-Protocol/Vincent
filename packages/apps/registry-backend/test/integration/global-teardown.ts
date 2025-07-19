import { teardown as teardownDevServer } from 'jest-process-manager';

import { stopMongoMemoryServer } from './mongodb-memory-server';

module.exports = async function globalTeardown() {
  await teardownDevServer();

  // Stop MongoDB Memory Server
  await stopMongoMemoryServer();

  console.log('Test server and MongoDB Memory Server stopped');
};
