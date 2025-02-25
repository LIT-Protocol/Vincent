import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type { Agenda } from 'agenda';

import { userRoutes } from './routes/user.routes';
import { purchaseRoutes } from './routes/purchase.routes';
import {
  createAgenda,
  startScheduler,
  stopScheduler,
} from './scheduler/scheduler';

export interface ServerConfig {
  port?: number;
  logger?: boolean;
  dbUri?: string;
  debug?: boolean;
}

export class Server {
  protected fastify: FastifyInstance;
  protected port: number;
  protected dbUri: string;
  protected agendaInstance: Agenda | null = null;

  constructor(config: ServerConfig = {}) {
    this.fastify = Fastify({
      logger: config.logger ?? true,
    });
    this.port = config.port ?? 3000;
    this.dbUri =
      config.dbUri ?? 'mongodb://localhost:27017/vincent-service-dca';

    // Configure agenda
    this.agendaInstance = createAgenda(this.dbUri, config.debug ?? false);
  }

  async start() {
    // Wait for agenda to be ready and start the scheduler
    await startScheduler();

    // Register routes
    await this.fastify.register(userRoutes);
    await this.fastify.register(purchaseRoutes);

    // Start server
    try {
      await this.fastify.listen({ port: this.port });
      this.fastify.log.info(`Server is running on port ${this.port}`);
    } catch (err) {
      this.fastify.log.error(err);
      throw err;
    }
  }

  async stop() {
    // Stop agenda if it's running
    await stopScheduler();

    // Stop server
    await this.fastify.close();
    this.fastify.log.info('Server closed');
  }

  get baseUrl() {
    return `http://localhost:${this.port}`;
  }

  setPort(port: number) {
    this.port = port;
  }
}

// Create and export default server instance
const server = new Server();

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

export default server;
