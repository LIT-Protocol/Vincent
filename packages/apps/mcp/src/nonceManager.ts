import NodeCache from 'node-cache';
import { generateNonce } from 'siwe';

import { env } from './env/http';

const { SIWE_NONCE_CLEAN_INTERVAL, SIWE_NONCE_TTL } = env;

class NonceManager {
  private readonly nonceCache: NodeCache;

  constructor() {
    this.nonceCache = new NodeCache({
      checkperiod: SIWE_NONCE_CLEAN_INTERVAL / 1000,
      deleteOnExpire: true,
      stdTTL: SIWE_NONCE_TTL / 1000,
      useClones: false, // Set useClones to false to store arrays by reference
    });
  }

  private getNoncesForAddress(address: string): string[] {
    return this.nonceCache.get<string[]>(address) || [];
  }

  private setNoncesForAddress(address: string, nonces: string[]): void {
    this.nonceCache.set(address, nonces, SIWE_NONCE_TTL / 1000);
  }

  getNonce(address: string): string {
    const nonce = generateNonce();
    const nonces = this.getNoncesForAddress(address);

    nonces.push(nonce);
    this.setNoncesForAddress(address, nonces);

    return nonce;
  }

  consumeNonce(address: string, nonce: string): boolean {
    const nonces = this.getNoncesForAddress(address);
    const nonceIndex = nonces.indexOf(nonce);

    if (nonceIndex !== -1) {
      // Nonce found and valid (since it's in the cache, it hasn't expired)
      // We don't remove it to handle repeated requests from clients
      return true;
    }

    return false;
  }
}

export const nonceManager = new NonceManager();
