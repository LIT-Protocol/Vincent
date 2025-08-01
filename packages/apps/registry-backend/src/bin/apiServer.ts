import { startApiServer } from '../lib/apiServer';

startApiServer().catch((error) => {
  console.error('!!! Failed to initialize service', (error as Error).message);
  process.exit(1);
});
