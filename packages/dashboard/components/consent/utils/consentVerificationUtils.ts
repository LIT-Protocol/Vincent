import { getUserViewRegistryContract } from './contracts';
import bs58 from 'bs58';

/**
 * Converts a hex-encoded IPFS CID to base58 format
 * @param hexCid Hex-encoded IPFS CID
 * @returns Base58-encoded IPFS CID or the original string if conversion fails
 */
export const hexToBase58 = (hexCid: string): string => {
  try {
    const bytes = Buffer.from(hexCid.substring(2), 'hex');
    return bs58.encode(bytes);
  } catch (error) {
    console.error('Error converting hex to base58:', error);
    return hexCid;
  }
};

/**
 * Checks if an app is already permitted for a PKP
 * @param agentPKPTokenId Token ID of the agent PKP
 * @param appId ID of the app to check
 * @param statusCallback Optional callback for status updates
 * @returns Object with permission status and version if permitted
 */
export const checkAppPermissionStatus = async (
  agentPKPTokenId: string,
  appId: string | number,
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void
) => {
  if (!agentPKPTokenId || !appId) {
    console.error('Missing required data for permission check');
    return { isPermitted: false, permittedVersion: null };
  }

  statusCallback?.('Checking if app version is already permitted...', 'info');

  try {
    const userViewContract = getUserViewRegistryContract();
    const appIdNum = Number(appId);
    const currentPermittedVersion = await userViewContract.getPermittedAppVersionForPkp(
      agentPKPTokenId,
      appIdNum,
    );
    const versionNumber = currentPermittedVersion.toNumber();
    return { isPermitted: true, permittedVersion: versionNumber };
  } catch (e) {
    console.error('Error checking for permitted apps:', e);
    return { isPermitted: false, permittedVersion: null };
  }
};

/**
 * Verifies that a permission grant was successful by checking the permitted version
 * @param agentPKPTokenId Token ID of the agent PKP
 * @param appId ID of the app to check
 * @param expectedVersion The version number that should be permitted
 * @param statusCallback Optional callback for status updates
 * @returns The verified version number if successful, null otherwise
 */
export const verifyPermissionGrant = async (
  agentPKPTokenId: string,
  appId: string | number,
  expectedVersion: number,
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void
) => {
  if (!agentPKPTokenId || !appId || expectedVersion === undefined) {
    console.error('Missing required data for verification');
    return null;
  }

  try {
    statusCallback?.('Verifying permission grant...', 'info');

    const userViewContract = getUserViewRegistryContract();
    const verifiedVersion = await userViewContract.getPermittedAppVersionForPkp(
      agentPKPTokenId,
      Number(appId),
    );

    const verifiedVersionNum = verifiedVersion.toNumber();

    if (verifiedVersionNum !== expectedVersion) {
      console.error(
        `VERSION MISMATCH: Expected version ${expectedVersion} but found ${verifiedVersionNum}`,
      );
      statusCallback?.('Version verification failed - unexpected version number', 'warning');
      return verifiedVersionNum;
    } else {
      return verifiedVersionNum;
    }
  } catch (verifyError) {
    console.error('Error verifying permitted version after update:', verifyError);
    statusCallback?.('Could not verify permission grant', 'warning');
    return null;
  }
};