import { Chain, WalletClient } from 'viem';

// Datil Network Context
export interface IVincentNetworkContext<T> {
  network: string;
  rpcUrl: string;
  chainConfig: {
    chain: Chain;
    contractData: T;
    diamondAddress: `0x${string}`;
  };
  walletClient: WalletClient;
}
