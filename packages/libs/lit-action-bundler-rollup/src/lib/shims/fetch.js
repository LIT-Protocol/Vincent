// src/lib/shims/fetch.js

/**
 * A Deno-compatible fetch shim for use in environments like LIT Actions. This re-exports the native
 * fetch-related globals from `globalThis`.
 */

export const fetch = globalThis.fetch;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;

export default globalThis.fetch;
