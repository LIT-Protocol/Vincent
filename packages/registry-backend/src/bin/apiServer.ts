import { startApiServer } from '../lib/apiServer';

async function gogo() {
  try {
    await startApiServer();
  } catch (error) {
    console.error('!!! Failed to initialize service', (error as Error)?.message);
    throw error;
  }
}

gogo();
