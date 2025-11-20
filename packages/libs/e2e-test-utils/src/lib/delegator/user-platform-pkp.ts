import type { PkpInfo } from '../mint-new-pkp';

import { getChainHelpers } from '../chain';
import { ensureWalletHasTestTokens } from '../funder/ensure-wallet-has-test-tokens';
import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';
import { mintNewPkp } from '../mint-new-pkp';

// Get an existing, or mint a new one if there is no existing, User Platform PKP using the EOA owner's address
export const ensureUserPlatformPkpExists = async (): Promise<PkpInfo> => {
  const {
    wallets: { platformUserPkpOwner },
  } = await getChainHelpers();

  const litContractClient = await getLitContractsClient({ wallet: platformUserPkpOwner });
  const ownedPkps = await litContractClient.pkpNftContractUtils.read.getTokensInfoByAddress(
    platformUserPkpOwner.address,
  );

  if (ownedPkps.length > 1) {
    console.warn(
      '> 1 PKP found for platform user PKP owner. When e2e testing, we recommend that you use a _dedicated platform user PKP owner account_ which always only has a single User Platform PKP. Using the first PKP found.',
      ownedPkps,
    );
  }

  if (ownedPkps.length > 0) {
    console.log(
      `${platformUserPkpOwner.address} has a User Platform PKP -- using existing PKP with ethAddress: ${ownedPkps[0].ethAddress}, tokenId: ${ownedPkps[0].tokenId}`,
    );

    const { tokenId, ethAddress } = ownedPkps[0];
    return { tokenId, ethAddress };
  }

  console.log(
    `No User Platform PKPs found; minting a new User Platform PKP for ${platformUserPkpOwner.address}...`,
  );

  // Be sure the platformUserPkpOwner has enough test tokens to mint a new PKP
  await ensureWalletHasTestTokens({ address: await platformUserPkpOwner.getAddress() });

  const { tokenId, ethAddress } = await mintNewPkp({ wallet: platformUserPkpOwner });

  console.log(
    `ℹ️  Minted new User Platform PKP with ethAddress: ${ethAddress}, tokenId: ${tokenId}`,
  );

  return { tokenId, ethAddress };
};

export const ensureFundedUserPlatformPkpExists = async (): Promise<PkpInfo> => {
  const userPlatformPkp = await ensureUserPlatformPkpExists();

  await ensureWalletHasTestTokens({ address: userPlatformPkp.ethAddress });

  return userPlatformPkp;
};

let userPlatformPkpInfo: PkpInfo | null = null;

// Returns User Platform PKP info for this run.
// This method will mint a new User Platform PKP if none exists for the current agent wallet owner.
// This method will also fund the User Platform PKP if it is not already funded.
export const getFundedUserPlatformPkp = async (): Promise<PkpInfo> => {
  if (userPlatformPkpInfo) {
    return userPlatformPkpInfo;
  }

  userPlatformPkpInfo = await ensureFundedUserPlatformPkpExists();
  return userPlatformPkpInfo;
};
