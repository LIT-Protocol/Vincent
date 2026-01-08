import { ethers } from 'ethers';

/**
 * Derives a deterministic smart account index from an app ID.
 * This ensures each app gets a unique smart account per user.
 */
export function deriveSmartAccountIndex(appId: number): bigint {
  const indexString = `vincent_app_id_${appId}`;
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(indexString));
  return BigInt(hash);
}
