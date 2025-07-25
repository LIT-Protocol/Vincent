/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// prelude.ts
export async function installNodeGlobals() {
  const { Buffer } = await import('node:buffer'); // ✅ Real source
  const { process } = await import('node:process');

  const timers = await import('node:timers');
  const { setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate } =
    timers;

  Object.assign(globalThis, {
    Buffer,
    process,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    setImmediate,
    clearImmediate,
  });
}
