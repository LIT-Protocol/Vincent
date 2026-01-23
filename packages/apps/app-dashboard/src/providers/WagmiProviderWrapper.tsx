import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base, baseSepolia, AppKitNetwork } from '@reown/appkit/networks';
import { env } from '@/config/env';

const { VITE_WALLETCONNECT_PROJECT_ID } = env;

// All networks including Chronicle Yellowstone
const allNetworks = [base, baseSepolia] as [AppKitNetwork, ...AppKitNetwork[]];

// Single unified wagmi configuration - no global AppKit instance
const wagmiAdapter = new WagmiAdapter({
  projectId: VITE_WALLETCONNECT_PROJECT_ID,
  networks: allNetworks,
});

export default function WagmiProviderWrapper({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiAdapter.wagmiConfig}>{children}</WagmiProvider>;
}
