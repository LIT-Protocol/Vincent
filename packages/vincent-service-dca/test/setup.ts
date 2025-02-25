import { config } from '@dotenvx/dotenvx';

// Load environment variables
config();

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeEach, afterEach } from '@jest/globals';

let mongod: MongoMemoryServer;

beforeEach(async () => {
  // Start MongoDB Memory Server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  // Connect to the in-memory database
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }

  // Close mongoose connection
  await mongoose.disconnect();

  // Stop MongoDB Memory Server
  await mongod.stop();
});
