import { teardown as teardownDevServer } from 'jest-process-manager';

module.exports = async function globalTeardown() {
  await teardownDevServer();
  // Your global teardown
};
