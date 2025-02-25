import { Server } from '../../src/lib/server';

export class TestServer extends Server {
  constructor() {
    // Generate random port between 3000 and 3100
    const port = Math.floor(Math.random() * (3100 - 3000 + 1)) + 3000;

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }

    super({
      port,
      logger: false,
      dbUri: process.env.MONGODB_URI,
      debug: true, // Enable debug mode for tests
    });
  }

  override async start() {
    try {
      await super.start();
    } catch (err) {
      // If port is in use, try another random port
      if ((err as any).code === 'EADDRINUSE') {
        const newPort = Math.floor(Math.random() * (3100 - 3000 + 1)) + 3000;
        this.setPort(newPort);
        await super.start();
      } else {
        throw err;
      }
    }
  }
}
