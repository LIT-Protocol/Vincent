import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

import { yellowstone } from '@/config/chains';

const demoAppInfo = {
  appName: 'Vincent',
};

const queryClient = new QueryClient();

export default function RainbowKitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme()}
        initialChain={yellowstone}
        appInfo={demoAppInfo}
      >
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  );
}
