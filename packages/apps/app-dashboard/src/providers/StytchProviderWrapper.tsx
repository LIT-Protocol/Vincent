import { ReactNode } from 'react';
import { StytchProvider } from '@stytch/react';
import { StytchUIClient } from '@stytch/vanilla-js';

import { env } from '@/config/env';

const { VITE_STYTCH_PUBLIC_TOKEN } = env;

const stychtClient = new StytchUIClient(VITE_STYTCH_PUBLIC_TOKEN);

export default function StytchProviderWrapper({ children }: { children: ReactNode }) {
  return <StytchProvider stytch={stychtClient}>{children}</StytchProvider>;
}
