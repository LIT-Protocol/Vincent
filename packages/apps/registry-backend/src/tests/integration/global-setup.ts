import { setup as setupDevServer } from 'jest-process-manager';
import { resolve } from 'path';

module.exports = async function globalSetup() {
  await setupDevServer({
    command: 'pnpm dev',
    launchTimeout: 30000,
    port: Number(process.env.PORT || 3000),
    options: {
      cwd: resolve(__dirname, '../../../'),
    },
    waitOnScheme: {
      delay: 1000,
    },
    usedPortAction: 'kill',
    debug: true,
  });
  // Your global setup
};
