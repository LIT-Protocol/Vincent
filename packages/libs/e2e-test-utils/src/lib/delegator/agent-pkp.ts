import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { PkpInfo } from '../mint-new-pkp';

import { getChainHelpers } from '../chain';
import { ensureWalletHasTestTokens } from '../funder/ensure-wallet-has-test-tokens';
import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';
import { mintNewPkp } from '../mint-new-pkp';
import { getPlatformUserPkpWallet } from './get-platform-user-pkp-wallet';
import { getFundedPlatformUserPkp } from './platform-user-pkp';

/**
 * Get an existing Agent PKP for a specific app ID, or mint a new one if none exists.
 * The Agent PKP will be owned by the User Platform PKP.
 * This function queries all Agent PKPs owned by the User Platform PKP and finds the one
 * that has permissions for the specified app ID.
 * @param appId the app ID to get or create an Agent PKP for
 * @returns the Agent PKP info for the specified app
 */
export const ensureAgentPkpExists = async (appId: number): Promise<PkpInfo> => {
  const {
    wallets: { platformUserWalletOwner },
  } = await getChainHelpers();

  // Get or create the Platform User PKP first
  const platformUserPkp = await getFundedPlatformUserPkp();

  // Get all PKPs owned by the Platform User PKP using Lit Contracts Client
  const litContractClient = await getLitContractsClient({ wallet: platformUserWalletOwner });
  await litContractClient.connect();

  const ownedPkps = await litContractClient.pkpNftContractUtils.read.getTokensInfoByAddress(
    platformUserPkp.ethAddress,
  );

  console.log(
    `Platform User PKP ${platformUserPkp.ethAddress} owns ${ownedPkps.length} Agent PKP(s)`,
  );

  // If there are owned PKPs, query their permitted apps to find the one for this app ID
  if (ownedPkps.length > 0) {
    const client = getClient({ signer: platformUserWalletOwner });

    // Query all owned PKP addresses to find which one has permission for this app
    const pkpAddresses = ownedPkps.map((pkp) => pkp.ethAddress);

    // Get permitted apps for all owned PKPs
    const permittedAppsData = await client.getPermittedAppsForPkps({
      pkpEthAddresses: pkpAddresses,
      offset: '0',
    });

    // Find the PKP that has permission for the specified app ID
    for (const pkpData of permittedAppsData) {
      const hasAppPermission = pkpData.permittedApps.some((app) => app.appId === appId);

      if (hasAppPermission) {
        const matchingPkp = ownedPkps.find((pkp) => pkp.tokenId === pkpData.pkpTokenId);
        if (matchingPkp) {
          console.log(
            `Found existing Agent PKP for app ${appId} with ethAddress: ${matchingPkp.ethAddress}, tokenId: ${matchingPkp.tokenId}`,
          );
          const publicKey = await litContractClient.pkpNftContract.read.getPubkey(
            matchingPkp.tokenId,
          );
          return {
            tokenId: matchingPkp.tokenId,
            ethAddress: matchingPkp.ethAddress,
            publicKey,
          };
        }
      }
    }
  }

  console.log(
    `No Agent PKP found for app ${appId}; minting a new Agent PKP owned by Platform User PKP ${platformUserPkp.ethAddress}...`,
  );

  // Be sure the platformUserPkp has enough test tokens to mint a new PKP
  await ensureWalletHasTestTokens({ address: platformUserPkp.ethAddress });

  // Get PKP Ethers Wallet for the Platform User PKP
  const platformUserPkpWallet = await getPlatformUserPkpWallet(platformUserPkp);

  // Mint a new PKP using the Platform User PKP's wallet
  // This makes the Platform User PKP the owner and controller of the Agent PKP
  const { tokenId, ethAddress, publicKey } = await mintNewPkp({
    wallet: platformUserPkpWallet,
  });

  console.log(
    `Minted new Agent PKP ${ethAddress} owned by Platform User PKP ${platformUserPkp.ethAddress}`,
  );

  return { tokenId, ethAddress, publicKey };
};

export const ensureFundedAgentPkpExists = async (appId: number): Promise<PkpInfo> => {
  const agentPkp = await ensureAgentPkpExists(appId);

  await ensureWalletHasTestTokens({ address: agentPkp.ethAddress });

  return agentPkp;
};

// Map to store Agent PKPs by app ID for the current run
const agentPkpsByAppId: Map<number, PkpInfo> = new Map();

/**
 * Returns Agent PKP info for a specific app for this run.
 * This method will mint a new Agent PKP if none exists for the specified app.
 * This method will also fund the Agent PKP if it is not already funded.
 * @param appId the app ID to get a funded Agent PKP for
 * @returns the funded Agent PKP info for the specified app
 */
export const getFundedAgentPkp = async (appId: number): Promise<PkpInfo> => {
  const cached = agentPkpsByAppId.get(appId);
  if (cached) {
    // Verify that the cached PKP still has sufficient funds
    await ensureWalletHasTestTokens({ address: cached.ethAddress });
    return cached;
  }

  const agentPkp = await ensureFundedAgentPkpExists(appId);
  agentPkpsByAppId.set(appId, agentPkp);
  return agentPkp;
};
