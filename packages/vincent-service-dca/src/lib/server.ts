import type { Agenda } from 'agenda';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

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

export const DOMAIN =
  process.env.DOMAIN ||
  process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME ||
  (`localhost:${process.env.PORT}` as const);

const corsOptions = {
  optionsSuccessStatus: 200,
  origin: async (origin: string | undefined): Promise<boolean> => {
    if (!origin) {
      return true;
    }

    // FIXME: Don't allow localhost to hit production instances of this service.
    const allowedOrigins = [
      /^https?:\/\/localhost(:\d+)?$/, // localhost with any port
      // eslint-disable-next-line no-useless-escape
      new RegExp(`^https?:\/\/${DOMAIN}$`),
    ];

    if (allowedOrigins.some((regex) => regex.test(origin))) {
      return true;
    } else {
      throw new Error('Not allowed by CORS');
    }
  },
};

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

    await this.fastify.register(cors, corsOptions);

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

export default server;
