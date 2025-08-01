// ReplSet required for transaction support
import { MongoMemoryReplSet } from 'mongodb-memory-server';
let mongoServer: MongoMemoryReplSet;

/**
 * Start an in-memory MongoDB server
 * @returns The MongoDB connection URI
 */
export async function startMongoMemoryServer(): Promise<string> {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const uri = mongoServer.getUri();
  console.log(`MongoDB Memory Server started at ${uri}`);
  return uri;
}

/**
 * Stop the in-memory MongoDB server
 */
export async function stopMongoMemoryServer(): Promise<void> {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped');
  }
}
