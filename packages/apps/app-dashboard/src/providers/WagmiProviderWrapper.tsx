import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum, optimism, base, AppKitNetwork } from '@reown/appkit/networks';
import { yellowstone } from '@/config/chains';

import { env } from '@/config/env';

const { VITE_WALLETCONNECT_PROJECT_ID, VITE_DASHBOARD_URL } = env;

// All networks including Chronicle Yellowstone
const allNetworks = [mainnet, polygon, arbitrum, optimism, base, yellowstone] as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

// Single unified wagmi configuration through AppKit
const wagmiAdapter = new WagmiAdapter({
  projectId: VITE_WALLETCONNECT_PROJECT_ID,
  networks: allNetworks,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [...allNetworks],
  projectId: VITE_WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Vincent',
    description: 'Vincent Dashboard',
    url: typeof window !== 'undefined' ? window.location.origin : VITE_DASHBOARD_URL,
    icons: [`${VITE_DASHBOARD_URL}/logo.svg`],
  },
  themeMode: 'dark',
});

export default function WagmiProviderWrapper({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiAdapter.wagmiConfig}>{children}</WagmiProvider>;
}
