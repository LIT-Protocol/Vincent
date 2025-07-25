import type { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

import { LitNodeClientInstance } from './LitNodeClientInstance';

let instance: LitNodeClientInstance | null = null;

export async function getLitNodeClientInstance({
  network,
}: {
  network: LIT_NETWORKS_KEYS;
}): Promise<LitNodeClient> {
  if (instance) {
    // connect() is idempotent; if we're retrying from outside, attempt to connect again
    // This is a no-op if already connected 🎉 but if a prior attempt fails, it'll try again.
    await instance.connect();
    return instance.litNodeClient;
  }

  instance = new LitNodeClientInstance({ network });
  await instance.connect();

  return instance.litNodeClient;
}

export async function disconnectLitNodeClientInstance() {
  if (instance) {
    await instance.disconnect();
    instance = null;
  }
  return true;
}
