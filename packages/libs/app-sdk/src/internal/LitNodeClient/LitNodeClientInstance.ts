import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

import { LitNodeClient } from '@lit-protocol/lit-node-client';

export class LitNodeClientInstance {
  private readonly litNodeClientInstance: LitNodeClient;

  private isConnected = false;

  private connectHandle: Promise<boolean> | null = null;

  constructor({ network }: { network: LIT_NETWORKS_KEYS }) {
    this.litNodeClientInstance = new LitNodeClient({
      debug: true,
      litNetwork: network,
    });
  }

  async connect(): Promise<boolean> {
    if (!this.isConnected) {
      // Coalesce concurrent calls
      if (this.connectHandle) {
        return this.connectHandle;
      }

      // Stash a handle so concurrent calls to connect are coaelesced into 1
      this.connectHandle = this.litNodeClientInstance.connect().then(() => true);

      try {
        // Don't return until we know the result of pending connect attempt
        await this.connectHandle;
        this.isConnected = true;
      } catch (e) {
        // We allow multiple calls to (retries!) to `connect()` even in case where one succeeded
        // if `isConnected` is false (e.g. a prior attempt failed)
        this.isConnected = false;
        throw e;
      } finally {
        this.connectHandle = null;
      }
      return this.isConnected;
    }

    return true;
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected && this.connectHandle) {
      // Wait for connect attempt to finish so we don't end up just re-adding the listener when it finishes.
      try {
        await this.connectHandle;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        /* Ignore errors on connect; we're disconnecting! */
      }
    }

    try {
      await this.litNodeClientInstance.disconnect();
    } catch (e) {
      /* We did our best */
      console.log('Failed to disconnect from LitNodeClientInstance.', (e as Error).message);
    } finally {
      this.isConnected = false;
    }
  }

  get litNodeClient(): LitNodeClient {
    return this.litNodeClientInstance;
  }
}
