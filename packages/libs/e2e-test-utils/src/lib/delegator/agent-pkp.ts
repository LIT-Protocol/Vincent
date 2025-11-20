import type { PkpInfo } from '../mint-new-pkp';

import { getChainHelpers } from '../chain';
import { ensureWalletHasTestTokens } from '../funder/ensure-wallet-has-test-tokens';
import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';
import { mintAgentPkp } from '../mint-agent-pkp';
import { getFundedUserPlatformPkp } from './user-platform-pkp';

/**
 * Get an existing Agent PKP for a specific app ID, or mint a new one if none exists.
 * The Agent PKP will be owned by the User Platform PKP.
 * @param appId the app ID to get or create an Agent PKP for
 * @returns the Agent PKP info for the specified app
 */
export const ensureAgentPkpExists = async (appId: number): Promise<PkpInfo> => {
  const {
    wallets: { platformUserPkpOwner },
  } = await getChainHelpers();

  // Get or create the User Platform PKP first
  const userPlatformPkp = await getFundedUserPlatformPkp();

  // Get all PKPs owned by the User Platform PKP
  const litContractClient = await getLitContractsClient({ wallet: platformUserPkpOwner });
  const ownedPkps = await litContractClient.pkpNftContractUtils.read.getTokensInfoByAddress(
    userPlatformPkp.ethAddress,
  );

  console.log(
    `User Platform PKP ${userPlatformPkp.ethAddress} owns ${ownedPkps.length} Agent PKP(s)`,
  );

  // For now, we'll use a simple mapping: first PKP for app 1, second for app 2, etc.
  // In the future, you might want to store app ID metadata on-chain or use a more sophisticated mapping
  const agentPkpIndex = appId - 1;

  if (ownedPkps.length > agentPkpIndex) {
    const existingAgentPkp = ownedPkps[agentPkpIndex];
    console.log(
      `Using existing Agent PKP for app ${appId} with ethAddress: ${existingAgentPkp.ethAddress}, tokenId: ${existingAgentPkp.tokenId}`,
    );

    const { tokenId, ethAddress } = existingAgentPkp;
    return { tokenId, ethAddress };
  }

  console.log(
    `No Agent PKP found for app ${appId}; minting a new Agent PKP owned by User Platform PKP ${userPlatformPkp.ethAddress}...`,
  );

  // Be sure the platformUserPkpOwner has enough test tokens to mint a new PKP
  await ensureWalletHasTestTokens({ address: await platformUserPkpOwner.getAddress() });

  const { tokenId, ethAddress } = await mintAgentPkp({
    wallet: platformUserPkpOwner,
    userPlatformPkpInfo: userPlatformPkp,
  });

  return { tokenId, ethAddress };
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
    return cached;
  }

  const agentPkp = await ensureFundedAgentPkpExists(appId);
  agentPkpsByAppId.set(appId, agentPkp);
  return agentPkp;
};
