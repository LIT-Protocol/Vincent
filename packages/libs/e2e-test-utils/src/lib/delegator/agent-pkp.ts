import type { PkpInfo } from '../mint-new-pkp';

import { getChainHelpers } from '../chain';
import { ensureWalletHasTestTokens } from '../funder/ensure-wallet-has-test-tokens';
import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';
import { mintNewPkp } from '../mint-new-pkp';

// Get an existing, or mint a new one if there is no existing, agent PKP using the agent wallet owner's address
export const ensureAgentPkpExists = async (): Promise<PkpInfo> => {
  const {
    wallets: { agentWalletOwner },
  } = await getChainHelpers();

  const litContractClient = await getLitContractsClient({ wallet: agentWalletOwner });
  const ownedPkps = await litContractClient.pkpNftContractUtils.read.getTokensInfoByAddress(
    agentWalletOwner.address,
  );

  if (ownedPkps.length > 1) {
    console.warn(
      '> 1 PKP found for agent wallet owner. When e2e testing, we recommend that you use a _dedicated agent wallet owner account_ which always only has a single agent PKP. Using the first PKP found.',
    );
  }

  if (ownedPkps.length > 0) {
    console.log(
      `${agentWalletOwner.address} has a PKP -- using existing PKP with ethAddress: ${ownedPkps[0].ethAddress}, tokenId: ${ownedPkps[0].tokenId}`,
    );

    const { tokenId, ethAddress } = ownedPkps[0];
    return { tokenId, ethAddress };
  }

  console.log(`No agent PKPs found; minting a new agent PKP for ${agentWalletOwner.address}...`);

  // Be sure the agentWalletOwner has enough test tokens to mint a new PKP
  await ensureWalletHasTestTokens({ address: await agentWalletOwner.getAddress() });

  const { tokenId, ethAddress } = await mintNewPkp({ wallet: agentWalletOwner });

  return { tokenId, ethAddress };
};

export const ensureFundedAgentPkpExists = async (): Promise<PkpInfo> => {
  const agentPkp = await ensureAgentPkpExists();

  await ensureWalletHasTestTokens({ address: agentPkp.ethAddress });

  return agentPkp;
};

const agentPkpInfo: PkpInfo | null = null;

// Returns agent Pkp info for this run.
// This method will mint a new agent Pkp if none exists for the current agent wallet owner.
// This method will also fund the agent Pkp if it is not already funded.
export const getFundedAgentPkp = async (): Promise<PkpInfo> => {
  if (agentPkpInfo) {
    return agentPkpInfo;
  }

  return await ensureFundedAgentPkpExists();
};
