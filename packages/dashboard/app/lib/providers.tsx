'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { StytchProvider } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs/ui';
import { useEffect, useState } from 'react';
import { StytchUIClient } from '@stytch/vanilla-js';
import { config, queryClient } from './wagmi'; // We'll move these to a separate file

export function Providers({ children }: { children: React.ReactNode }) {
  const [stytchClient, setStytchClient] = useState<StytchUIClient | null>(null);

  useEffect(() => {
    const client = createStytchUIClient(
      process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ''
    );
    setStytchClient(client);
  }, []);

  if (!stytchClient) {
    return null; // or a loading state
  }

  return (
    <StytchProvider stytch={stytchClient}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </StytchProvider>
  );
} 