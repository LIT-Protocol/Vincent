import QueryClientProviderWrapper from '@/providers/QueryClientProviderWrapper';
import StytchProviderWrapper from '@/providers/StytchProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';
import ReduxProvider from '@/providers/ReduxProvider';

export const AppProviders = [
  ReduxProvider,
  StytchProviderWrapper,
  WagmiProviderWrapper,
  QueryClientProviderWrapper,
];

export const UserProviders = [
  ReduxProvider,
  StytchProviderWrapper,
  WagmiProviderWrapper,
  QueryClientProviderWrapper,
];
