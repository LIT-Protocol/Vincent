import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { env } from './env';

const { HTTP_TRANSPORT_TTL, HTTP_TRANSPORT_CLEAN_INTERVAL } = env;

class TransportManager {
  private readonly transports: {
    [sessionId: string]: {
      ttl: number;
      transport: StreamableHTTPServerTransport;
    };
  } = {};

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, { transport, ttl }] of Object.entries(this.transports)) {
        if (now > ttl) {
          transport.close().then(() => this.deleteTransport(sessionId));
        }
      }
    }, HTTP_TRANSPORT_CLEAN_INTERVAL);
  }

  addTransport(sessionId: string, transport: StreamableHTTPServerTransport) {
    this.transports[sessionId] = { ttl: Date.now() + HTTP_TRANSPORT_TTL, transport };
  }

  getTransport(sessionId: string) {
    const transportWithTtl = this.transports[sessionId];
    if (!transportWithTtl) {
      return;
    }

    const { transport } = transportWithTtl;
    this.transports[sessionId].ttl = Date.now() + HTTP_TRANSPORT_TTL;

    return transport;
  }

  deleteTransport(sessionId: string) {
    delete this.transports[sessionId];
  }
}

export const transportManager = new TransportManager();
