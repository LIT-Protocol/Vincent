import mongoose from 'mongoose';

async function initializeDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vincent-service-dca');
    console.log('Successfully connected to MongoDB');

    // Drop the existing database
    await mongoose.connection.dropDatabase();
    console.log('Existing database dropped');

    await mongoose.disconnect();
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
