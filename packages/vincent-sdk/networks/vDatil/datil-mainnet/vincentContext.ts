import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilFirstPrivateKey } from '../../shared/chains/anvil';
import { IVincentNetworkContext } from '../common/IVincentNetworkContext';
import { vincentDiamondAddress, vincentSignatures } from './vincent-signatures';
import { chronicleYellowstone } from '../../shared/chains/yellowstone.ts';

export const vincentMainnetNetworkContext: IVincentNetworkContext<
  typeof vincentSignatures
> = {
  network: 'datil',
  rpcUrl: chronicleYellowstone.rpcUrls.default.http[0],
  privateKey: anvilFirstPrivateKey,
  chainConfig: {
    chain: chronicleYellowstone,
    contractData: vincentSignatures,
    diamondAddress: vincentDiamondAddress,
  },
  walletClient: createWalletClient({
    chain: chronicleYellowstone,
    transport: http(chronicleYellowstone.rpcUrls.default.http[0]),
    account: privateKeyToAccount(anvilFirstPrivateKey),
  }),
};

export type VincentDatilMainnetNetworkContext =
  typeof vincentMainnetNetworkContext;
