import { ethers } from 'ethers';

/**
 * Derives a deterministic smart account index from an app ID.
 * This ensures each app gets a unique smart account per user.
 *
 * Matches Solidity: keccak256(abi.encodePacked("vincent_app_id_", appId))
 * where appId is uint40 (5 bytes).
 */
export function deriveSmartAccountIndex(appId: number): bigint {
  const prefix = ethers.utils.toUtf8Bytes('vincent_app_id_');
  const appIdBytes = ethers.utils.zeroPad(ethers.utils.hexlify(appId), 5); // uint40 = 5 bytes
  const packed = ethers.utils.concat([prefix, appIdBytes]);
  const hash = ethers.utils.keccak256(packed);
  return BigInt(hash);
}
