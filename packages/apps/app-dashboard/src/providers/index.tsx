import QueryClientProviderWrapper from '@/providers/QueryClientProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';
import AuthProviderWrapper from '@/providers/AuthProviderWrapper';
import ReduxProvider from '@/providers/ReduxProvider';

export const DashboardProviders = [
  ReduxProvider,
  QueryClientProviderWrapper,
  WagmiProviderWrapper,
  AuthProviderWrapper,
];

export const PublicProviders = [ReduxProvider, QueryClientProviderWrapper];
