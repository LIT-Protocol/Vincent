import QueryClientProviderWrapper from '@/providers/QueryClientProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';
import ReduxProvider from '@/providers/ReduxProvider';

export const DashboardProviders = [ReduxProvider, WagmiProviderWrapper, QueryClientProviderWrapper];

export const PublicProviders = [ReduxProvider, QueryClientProviderWrapper];
