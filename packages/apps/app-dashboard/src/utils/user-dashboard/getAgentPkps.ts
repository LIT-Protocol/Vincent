import { IRelayPKP } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { env } from '@/config/env';

const { VITE_VINCENT_DATIL_CONTRACT, VITE_DATIL_PKP_CONTRACT, VITE_VINCENT_YELLOWSTONE_RPC } = env;

// Create contract instance for the new PKP methods
const PKP_INFO_ABI = [
  'function getPkpInfoFromOwnerAddress(address owner, uint256 pageSize, uint256 pageIndex) public view returns (tuple(uint256 tokenId, bytes pubkey, address ethAddress)[] memory)',
];

// Fetch both permitted and unpermitted apps for all agent PKPs
const VINCENT_CONTRACT_ABI = [
  'function getPermittedAppsForPkps(uint256[] pkpTokenIds, uint256 offset, uint256 pageSize) public view returns (tuple(uint256 pkpTokenId, tuple(uint40 appId, uint24 version, bool versionEnabled)[] permittedApps)[] results)',
  'function getUnpermittedAppsForPkps(uint256[] pkpTokenIds, uint256 offset) public view returns (tuple(uint256 pkpTokenId, tuple(uint40 appId, uint24 previousPermittedVersion, bool versionEnabled)[] unpermittedApps)[] results)',
];

type PkpInfo = {
  tokenId: ethers.BigNumber;
  pubkey: string;
  ethAddress: string;
};

type ProcessedPkpInfo = {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
};

export type AgentAppPermission = {
  appId: number;
  pkp: IRelayPKP;
  permittedVersion: number | null;
  versionEnabled?: boolean;
};

export type AgentPkpsResult = {
  permitted: AgentAppPermission[];
  unpermitted: AgentAppPermission[];
};

/**
 * Get Agent PKPs for a user address
 *
 * Finds all Agent PKPs owned by the user that are different from their current PKP.
 * Returns both currently permitted and previously permitted (unpermitted) agent PKPs.
 *
 * @param userAddress The ETH address of the user's current PKP
 * @returns Promise<AgentPkpsResult> Object containing permitted and unpermitted agent PKPs
 * @throws Error if there's an issue with the contract calls
 */
export async function getAgentPkps(userAddress: string): Promise<AgentPkpsResult> {
  try {
    const yellowstoneProvider = new ethers.providers.JsonRpcProvider(VITE_VINCENT_YELLOWSTONE_RPC);
    const pkpInfoContract = new ethers.Contract(
      VITE_DATIL_PKP_CONTRACT,
      PKP_INFO_ABI,
      yellowstoneProvider,
    );

    // Temporarily config this to 100
    const pkpInfoArray = await pkpInfoContract.getPkpInfoFromOwnerAddress(userAddress, 100, 0);

    if (pkpInfoArray.length === 0) {
      return { permitted: [], unpermitted: [] };
    }

    // Convert the returned data to our expected format
    const allPKPs: ProcessedPkpInfo[] = pkpInfoArray.map((pkpInfo: PkpInfo) => ({
      tokenId: pkpInfo.tokenId.toString(),
      publicKey: pkpInfo.pubkey,
      ethAddress: pkpInfo.ethAddress,
    }));

    // Filter out PKPs where the ethAddress matches the userAddress (userPKP)
    const agentPKPs = allPKPs.filter(
      (pkp: ProcessedPkpInfo) => pkp.ethAddress.toLowerCase() !== userAddress.toLowerCase(),
    );

    const vincentContract = new ethers.Contract(
      VITE_VINCENT_DATIL_CONTRACT,
      VINCENT_CONTRACT_ABI,
      yellowstoneProvider,
    );

    const agentTokenIds = agentPKPs.map((pkp) => pkp.tokenId);

    const [permittedAppsArray, unpermittedAppsArray] = await Promise.all([
      vincentContract.getPermittedAppsForPkps(agentTokenIds, 0, 50), // Default page size
      vincentContract.getUnpermittedAppsForPkps(agentTokenIds, 0),
    ]);

    // Convert the permitted apps results to our format
    const pkpToPermittedAppsMap = new Map<
      string,
      Array<{ appId: number; version: number | null }>
    >();
    for (const pkpPermittedApps of permittedAppsArray) {
      const tokenId = pkpPermittedApps.pkpTokenId.toString();
      const pkp = agentPKPs.find((p: ProcessedPkpInfo) => p.tokenId === tokenId);
      if (pkp) {
        const appsWithVersions = pkpPermittedApps.permittedApps.map(
          (app: { appId: number; version: number; versionEnabled: boolean }) => ({
            appId: app.appId,
            version: app.version,
          }),
        );
        pkpToPermittedAppsMap.set(pkp.ethAddress, appsWithVersions);
      }
    }

    // Convert the unpermitted apps results to our format
    const pkpToUnpermittedAppsMap = new Map<
      string,
      Array<{ appId: number; previousPermittedVersion: number | null; versionEnabled: boolean }>
    >();
    for (const pkpUnpermittedApps of unpermittedAppsArray) {
      const tokenId = pkpUnpermittedApps.pkpTokenId.toString();
      const pkp = agentPKPs.find((p: ProcessedPkpInfo) => p.tokenId === tokenId);
      if (pkp) {
        const appsWithVersions = pkpUnpermittedApps.unpermittedApps.map(
          (app: { appId: number; previousPermittedVersion: number; versionEnabled: boolean }) => ({
            appId: app.appId,
            previousPermittedVersion: app.previousPermittedVersion,
            versionEnabled: app.versionEnabled,
          }),
        );
        pkpToUnpermittedAppsMap.set(pkp.ethAddress, appsWithVersions);
      }
    }

    const permitted: AgentAppPermission[] = [];
    const unpermitted: AgentAppPermission[] = [];
    let unpermittedAgentPKP: IRelayPKP | null = null;

    for (const pkp of agentPKPs) {
      const permittedApps = pkpToPermittedAppsMap.get(pkp.ethAddress) || [];
      const unpermittedApps = pkpToUnpermittedAppsMap.get(pkp.ethAddress) || [];

      // Add permitted apps
      for (const app of permittedApps) {
        permitted.push({
          appId: app.appId,
          pkp,
          permittedVersion: app.version,
        });
      }

      // Add unpermitted apps (previously permitted)
      for (const app of unpermittedApps) {
        unpermitted.push({
          appId: app.appId,
          pkp,
          permittedVersion: app.previousPermittedVersion,
          versionEnabled: app.versionEnabled,
        });
      }

      // Track PKPs with no apps at all
      if (permittedApps.length === 0 && unpermittedApps.length === 0 && !unpermittedAgentPKP) {
        unpermittedAgentPKP = pkp;
      }
    }

    // If no permitted PKPs found but we have an unpermitted agent PKP, return it with appId -1
    if (permitted.length === 0 && unpermittedAgentPKP) {
      permitted.push({
        appId: -1,
        pkp: unpermittedAgentPKP,
        permittedVersion: null,
      });
    }

    console.log('[getAgentPkps] Final result:', {
      permittedCount: permitted.length,
      unpermittedCount: unpermitted.length,
      permitted: permitted,
      unpermitted: unpermitted,
    });

    return { permitted, unpermitted };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to get Agent PKPs: ${error}`);
    }
  }
}
