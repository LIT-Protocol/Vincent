import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the provided connection string
 *
 * @param mongoUri MongoDB connection URI
 * @param dbName MongoDB database name
 * @returns A promise that resolves when connected successfully
 */
export async function connectToMongoDB(
  mongoUri: string,
  dbName?: string,
): Promise<mongoose.Connection> {
  console.info(`Connecting to MongoDB @ ${mongoUri}`);

  let config = undefined;

  if (dbName) {
    config = { dbName };
  }

  await mongoose.connect(mongoUri, config);
  console.info('Connected to MongoDB');

  return mongoose.connection;
}
