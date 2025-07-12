import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilFirstPrivateKey } from '../../shared/chains/Anvil';
import { ChrnoicleYellowstone } from '../../shared/chains/ChrnoicleYellowstone';
import { IVincentNetworkContext } from '../shared/VincentChainClient/IVincentNetworkContext';
import { vincentDiamondAddress, vincentSignatures } from './vincent-signatures';

export const vincentMainnetNetworkContext: IVincentNetworkContext<typeof vincentSignatures> = {
  network: 'datil',
  rpcUrl: ChrnoicleYellowstone.rpcUrls[0],
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
