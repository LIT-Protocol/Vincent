import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from '@reown/appkit/networks';
import { yellowstone } from '@/config/chains';

import { env } from '@/config/env';

const { VITE_WALLETCONNECT_PROJECT_ID } = env;

// All networks including Chronicle Yellowstone
const allNetworks = [mainnet, polygon, arbitrum, optimism, base, yellowstone];

// Single unified wagmi configuration through AppKit
const wagmiAdapter = new WagmiAdapter({
  projectId: VITE_WALLETCONNECT_PROJECT_ID,
  networks: allNetworks,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, polygon, arbitrum, optimism, base, yellowstone],
  projectId: VITE_WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Vincent',
    description: 'Vincent Dashboard',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://dashboard.heyvincent.ai',
    icons: ['https://dashboard.heyvincent.ai/logo.svg'],
  },
  themeMode: 'dark',
});

export default function WagmiProviderWrapper({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiAdapter.wagmiConfig}>{children}</WagmiProvider>;
}
