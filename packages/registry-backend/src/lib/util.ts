import bs58 from 'bs58';

export const generateRandomCid = () => {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `Qm${bs58.encode(randomBytes)}`;
};
