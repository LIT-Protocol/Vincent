/* eslint-disable */
// @ts-nocheck
// shims/crypto.js

import * as _crypto from 'node:crypto';
export * from 'node:crypto';

// Clone to make it mutable
const crypto = { ..._crypto };

// Patch in Deno-native WebCrypto
if (!('webcrypto' in crypto) && typeof globalThis.crypto === 'object') {
  crypto.webcrypto = globalThis.crypto;
}

export default crypto;
