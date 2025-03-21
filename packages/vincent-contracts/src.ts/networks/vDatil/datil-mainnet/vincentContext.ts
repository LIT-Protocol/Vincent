import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilFirstPrivateKey } from '../../shared/chains/Anvil';
import { IVincentNetworkContext } from '../shared/IVincentNetworkContext';
import { vincentDiamondAddress, vincentSignatures } from './vincent-signatures';
import { ChrnoicleYellowstone } from '../../shared/chains/ChrnoicleYellowstone';

export const vincentMainnetNetworkContext: IVincentNetworkContext<
  typeof vincentSignatures
> = {
  network: 'datil',
  rpcUrl: ChrnoicleYellowstone.rpcUrls[0],
  privateKey: anvilFirstPrivateKey,
  chainConfig: {
    chain: ChrnoicleYellowstone.chainConfig(),
    contractData: vincentSignatures,
    diamondAddress: vincentDiamondAddress,
  },
  walletClient: createWalletClient({
    chain: ChrnoicleYellowstone.chainConfig(),
    transport: http(ChrnoicleYellowstone.rpcUrls[0]),
    account: privateKeyToAccount(anvilFirstPrivateKey),
  }),
};

export type VincentDatilMainnetNetworkContext =
  typeof vincentMainnetNetworkContext;
