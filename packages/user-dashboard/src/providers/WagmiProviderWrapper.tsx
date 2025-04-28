import { ReactNode } from 'react';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { yellowstone } from '@/config/chains.ts';

const wagmiConfig = createConfig({
  chains: [yellowstone],
  connectors: [injected()],
  transports: {
    [yellowstone.id]: http(),
  },
});

export default function WagmiProviderWrapper({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
}
