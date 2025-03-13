'use client';
import './globals.css';
import './styles/login.module.css';
import Header from '@/components/layout/Header';
import { WagmiProvider } from 'wagmi';
import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { yellowstone } from './config/chains';

const wagmiConfig = createConfig({
  chains: [yellowstone],
  connectors: [injected()],
  transports: {
    [yellowstone.id]: http(),
  },
});

const queryClient = new QueryClient();

const demoAppInfo = {
  appName: 'Vincent',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
          <html>
            <body>
              <RainbowKitProvider
                theme={darkTheme()}
                initialChain={yellowstone}
                appInfo={demoAppInfo}
              >
                <Header />
                <main className="max-w-screen-xl mx-auto p-6">{children}</main>
              </RainbowKitProvider>
            </body>
          </html>
        </QueryClientProvider>
      </WagmiProvider>
  );
}
