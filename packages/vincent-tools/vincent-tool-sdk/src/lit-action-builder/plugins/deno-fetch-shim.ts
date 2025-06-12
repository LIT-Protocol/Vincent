// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const denoFetch = (...args) => globalThis.fetch(...args);
export default denoFetch;
