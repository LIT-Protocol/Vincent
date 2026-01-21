import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  baseSepolia,
  AppKitNetwork,
} from '@reown/appkit/networks';
import { env } from '@/config/env';

const { VITE_WALLETCONNECT_PROJECT_ID, VITE_VINCENT_YELLOWSTONE_RPC } = env;

// Chronicle Yellowstone (Lit Protocol testnet)
const chronicleYellowstone: AppKitNetwork = {
  id: 175177,
  name: 'Chronicle Yellowstone',
  nativeCurrency: {
    name: 'LIT',
    symbol: 'LIT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [VITE_VINCENT_YELLOWSTONE_RPC],
    },
    public: {
      http: [VITE_VINCENT_YELLOWSTONE_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: 'Chronicle Explorer',
      url: 'https://yellowstone-explorer.litprotocol.com',
    },
  },
  testnet: true,
};

// All networks - Base Sepolia is primary for Vincent contracts
const allNetworks = [
  baseSepolia,
  chronicleYellowstone,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
] as [AppKitNetwork, ...AppKitNetwork[]];

// Single unified wagmi configuration - no global AppKit instance
const wagmiAdapter = new WagmiAdapter({
  projectId: VITE_WALLETCONNECT_PROJECT_ID,
  networks: allNetworks,
});

export default function WagmiProviderWrapper({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiAdapter.wagmiConfig}>{children}</WagmiProvider>;
}
