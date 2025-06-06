import express, { type Express } from 'express';

import { env } from '../env';
import { registerRoutes } from './express';
import { connectToMongoDB } from './mongoose';

const { MONGODB_URI, MONGO_DB_NAME, PORT } = env;

const app: Express = express();
registerRoutes(app);

const startApiServer = async () => {
  await connectToMongoDB(MONGODB_URI, MONGO_DB_NAME);
  console.info('Mongo is connected. Starting server...');

  await new Promise((resolve, reject) => {
    app.listen(PORT).once('listening', resolve).once('error', reject);
  });

  console.info(`Server is listening on port ${PORT}`);
};

// Export app definition for orchestration in integration tests, startApiServer() for bin deployment
export { app, startApiServer };
