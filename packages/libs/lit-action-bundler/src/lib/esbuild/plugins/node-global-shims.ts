// shims/node-globals.ts
export { Buffer } from 'node:buffer';
export { setTimeout, clearTimeout } from 'node:timers';
export const process = {
  env: {
    NODE_ENV: 'production',
  },
};
