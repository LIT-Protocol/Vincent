import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import NodeCache from 'node-cache';

import { env } from './env/http';

const { HTTP_TRANSPORT_TTL, HTTP_TRANSPORT_CLEAN_INTERVAL } = env;

class TransportManager {
  private readonly transportCache: NodeCache;

  constructor() {
    this.transportCache = new NodeCache({
      checkperiod: HTTP_TRANSPORT_CLEAN_INTERVAL / 1000,
      deleteOnExpire: true,
      stdTTL: HTTP_TRANSPORT_TTL / 1000,
      useClones: false, // Store transport by reference
    });

    // Set up cleanup handler when items expire
    this.transportCache.on(
      'expired',
      async (key: string, transport: StreamableHTTPServerTransport) => {
        try {
          await transport.close();
        } catch (error) {
          console.error(`Error closing transport for session ${key}:`, error);
        }
      },
    );
  }

  closeTransportManager() {
    this.transportCache.close();
  }

  addTransport(sessionId: string, transport: StreamableHTTPServerTransport) {
    this.transportCache.set(sessionId, transport);
  }

  getTransport(sessionId: string): StreamableHTTPServerTransport | undefined {
    const transport = this.transportCache.get<StreamableHTTPServerTransport>(sessionId);
    if (transport) {
      // Reset TTL on access
      this.transportCache.ttl(sessionId);
    }
    return transport;
  }

  async deleteTransport(sessionId: string): Promise<boolean> {
    const transport = this.transportCache.get<StreamableHTTPServerTransport>(sessionId);
    if (transport) {
      try {
        await transport.close();
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
    }
    return this.transportCache.del(sessionId) > 0;
  }
}

export const transportManager = new TransportManager();
