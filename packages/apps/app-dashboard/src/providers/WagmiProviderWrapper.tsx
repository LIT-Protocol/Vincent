import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from '@reown/appkit/networks';

import { env } from '@/config/env';

const { VITE_WALLETCONNECT_PROJECT_ID } = env;

// Single unified wagmi configuration through AppKit
const wagmiAdapter = new WagmiAdapter({
  projectId: VITE_WALLETCONNECT_PROJECT_ID,
  networks: [mainnet, polygon, arbitrum, optimism, base],
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, polygon, arbitrum, optimism, base],
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
