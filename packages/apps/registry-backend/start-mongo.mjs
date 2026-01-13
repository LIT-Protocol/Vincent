#!/usr/bin/env node

import { MongoMemoryReplSet } from 'mongodb-memory-server';

console.log('🚀 Starting in-memory MongoDB for development...');

const mongod = await MongoMemoryReplSet.create({
  replSet: { 
    count: 1, 
    storageEngine: 'wiredTiger',
    dbName: 'registry'
  },
  instanceOpts: [{
    port: 27017,
  }]
});

const uri = mongod.getUri();
console.log(`✅ MongoDB running at: ${uri}`);
console.log('📡 Ready for nx dev registry-backend');
console.log('Press Ctrl+C to stop...');

// Keep running until interrupted
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down MongoDB...');
  await mongod.stop();
  console.log('✅ Cleanup complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongod.stop();
  process.exit(0);
}); 