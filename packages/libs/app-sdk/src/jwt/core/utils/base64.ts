/**
 * Decodes a base64 or base64url string into a Uint8Array.
 * Works in Node.js, Deno, browsers, and Web Workers.
 *
 * No Buffer polyfill requirement.
 */
export function fromBase64(base64: string): Uint8Array {
  // Normalize base64url → base64
  const normalized = base64
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(base64.length / 4) * 4, '=');

  // Node.js
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return new Uint8Array(Buffer.from(normalized, 'base64'));
  }

  // Browser / Web Worker / Deno
  if (typeof atob !== 'undefined') {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error('No base64 decoding method available in this environment.');
}

/**
 * Converts a Uint8Array to a base64url-encoded string.
 * Works in all JS environments (Node.js, Deno, browser, Web Workers).
 * No Buffer polyfill requirement.
 */
export function toBase64Url(bytes: Uint8Array): string {
  // Node.js
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Browser / Deno / Web Worker
  if (typeof btoa !== 'undefined') {
    const binString = String.fromCharCode(...bytes);
    const base64 = btoa(binString);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  throw new Error('No base64 encoding method available in this environment.');
}
