import type { PkpInfo } from '../mint-new-pkp';

import { getChainHelpers } from '../chain';
import { ensureWalletHasTestTokens } from '../funder/ensure-wallet-has-test-tokens';
import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';
import { mintNewPkp } from '../mint-new-pkp';

export const ensurePlatformUserPkpExists = async (): Promise<PkpInfo> => {
  const {
    wallets: { platformUserWalletOwner },
  } = await getChainHelpers();

  const litContractClient = await getLitContractsClient({ wallet: platformUserWalletOwner });
  const ownedPkps = await litContractClient.pkpNftContractUtils.read.getTokensInfoByAddress(
    platformUserWalletOwner.address,
  );

  if (ownedPkps.length > 1) {
    console.warn(
      `${ownedPkps.length} PKPs found for platform user wallet owner. When e2e testing, we recommend that you use a _dedicated platform user wallet owner account_ which always only has a single platform user PKP. Using the first PKP found.`,
      ownedPkps,
    );
  }

  if (ownedPkps.length > 0) {
    console.log(
      `${platformUserWalletOwner.address} has a PKP -- using existing PKP with ethAddress: ${ownedPkps[0].ethAddress}, tokenId: ${ownedPkps[0].tokenId}`,
    );

    const { tokenId, ethAddress } = ownedPkps[0];
    const publicKey = await litContractClient.pkpNftContract.read.getPubkey(tokenId);
    return { tokenId, ethAddress, publicKey };
  }

  console.log(
    `No platform user PKP found; minting a new platform user PKP for ${platformUserWalletOwner.address}...`,
  );

  // Be sure the platformUserWalletOwner has enough test tokens to mint a new PKP
  await ensureWalletHasTestTokens({ address: await platformUserWalletOwner.getAddress() });

  const { tokenId, ethAddress, publicKey } = await mintNewPkp({ wallet: platformUserWalletOwner });

  return { tokenId, ethAddress, publicKey };
};

export const ensureFundedPlatformUserPkpExists = async (): Promise<PkpInfo> => {
  const platformUserPkp = await ensurePlatformUserPkpExists();

  await ensureWalletHasTestTokens({ address: platformUserPkp.ethAddress });

  return platformUserPkp;
};

let platformUserPkpInfo: PkpInfo | null = null;

/**
 * Returns platform user Pkp info for this run.
 * This method will mint a new platform user Pkp if none exists for the current platform user wallet owner.
 * This method will also fund the platform user Pkp if it is not already funded.
 */
export const getFundedPlatformUserPkp = async (): Promise<PkpInfo> => {
  if (platformUserPkpInfo) {
    return platformUserPkpInfo;
  }

  platformUserPkpInfo = await ensureFundedPlatformUserPkpExists();
  return platformUserPkpInfo;
};
