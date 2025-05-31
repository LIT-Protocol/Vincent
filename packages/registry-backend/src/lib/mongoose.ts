import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the provided connection string
 *
 * @param mongoUri MongoDB connection URI
 * @returns A promise that resolves when connected successfully
 */
export async function connectToMongoDB(mongoUri: string): Promise<mongoose.Connection> {
  console.info(`Connecting to MongoDB @ ${mongoUri}`);

  await mongoose.connect(mongoUri);
  console.info('Connected to MongoDB');

  return mongoose.connection;
}
