import { getChainHelpers } from '../chain';
import { ensureWalletHasTestTokens } from '../funder';

export const ensureAppDelegateeFunded = async () => {
  const {
    wallets: { appDelegatee },
  } = await getChainHelpers();

  return ensureWalletHasTestTokens({ address: await appDelegatee.getAddress() });
};
