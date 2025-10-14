import type { KeyType, Network } from '../types';

import { NETWORK_SOLANA } from '../constants';

/**
 * Returns the key type for the given network
 *
 * @param network - The network to get the key type for
 * @returns The key type for the given network
 */
export function getKeyTypeFromNetwork(network: Network): KeyType {
  switch (network) {
    case NETWORK_SOLANA:
      return 'ed25519';
    default:
      throw new Error(`Network not implemented ${network}`);
  }
}
