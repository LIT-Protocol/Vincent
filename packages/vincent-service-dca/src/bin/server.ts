import { Server } from '../lib/server';

// Create and export default server instance
const server = new Server({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  logger: true,
  dbUri: process.env.MONGODB_URI,
  debug: true,
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await server.stop();
    process.exit(0);
  } catch (err) {
    console.error('Error closing server:', err);
    process.exit(1);
  }
});

server.start();
