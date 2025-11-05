import { getChainHelpers } from '../chain';
import { ensureWalletHasTestTokens } from '../funder';

export const ensureAppManagerFunded = async () => {
  const {
    wallets: { appManager },
  } = await getChainHelpers();

  return ensureWalletHasTestTokens({ address: await appManager.getAddress() });
};
