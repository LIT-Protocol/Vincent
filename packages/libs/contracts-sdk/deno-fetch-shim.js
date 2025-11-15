// Shim for fetch in Lit Actions (which run in a Deno-like environment)
// This is used by esbuild to replace node-fetch and cross-fetch imports
// Lit Actions have a global fetch available, so we just export it

if (typeof fetch === 'undefined') {
  throw new Error('fetch is not available in this environment');
}

module.exports = fetch;
module.exports.default = fetch;
