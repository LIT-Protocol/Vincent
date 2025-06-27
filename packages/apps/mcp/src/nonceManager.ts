import { generateNonce } from 'siwe';

import { env } from './env';

const { SIWE_NONCE_CLEAN_INTERVAL, SIWE_NONCE_TTL } = env;

class NonceManager {
  private readonly nonces: {
    [address: string]: {
      ttl: number;
      nonce: string;
    }[];
  } = {};

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [address, nonces] of Object.entries(this.nonces)) {
        this.nonces[address] = nonces.filter((n) => n.ttl > now);
      }
    }, SIWE_NONCE_CLEAN_INTERVAL);
  }

  getNonce(address: string): string {
    const nonce = generateNonce();

    if (!this.nonces[address]) {
      this.nonces[address] = [];
    }

    this.nonces[address].push({
      ttl: Date.now() + SIWE_NONCE_TTL,
      nonce,
    });

    return nonce;
  }

  consumeNonce(address: string, nonce: string): boolean {
    const addressNonces = this.nonces[address] || [];

    const now = Date.now();
    const consumedNonce = addressNonces.find((n) => n.nonce === nonce && n.ttl > now);

    // Consumed nonce should be removed. But some clients are doing several repeated requests with it. TTL will handle it
    // if (consumedNonce) {
    //   // Remove consumed nonce
    //   this.nonces[address] = addressNonces.filter((n) => n.nonce !== nonce);
    // }

    return !!consumedNonce;
  }
}

export const nonceManager = new NonceManager();
