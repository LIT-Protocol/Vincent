import type { Network, KeyType } from './types';

export const CHAIN_YELLOWSTONE = 'yellowstone' as const;
export const LIT_PREFIX = 'lit_' as const;

export const NETWORK_SOLANA: Network = 'solana' as const;

export const KEYTYPE_ED25519: KeyType = 'ed25519' as const;

export const WRAPPED_KEYS_JWT_AUDIENCE = 'https://wrapped.litprotocol.com' as const;
