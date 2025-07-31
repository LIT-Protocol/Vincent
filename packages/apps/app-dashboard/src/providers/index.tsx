import RainbowKitProviderWrapper from '@/providers/RainbowKitProviderWrapper';
import StytchProviderWrapper from '@/providers/StytchProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';
import ReduxProvider from '@/providers/ReduxProvider';

export const AppProviders = [
  ReduxProvider,
  StytchProviderWrapper,
  WagmiProviderWrapper,
  RainbowKitProviderWrapper,
];

export const UserProviders = [
  ReduxProvider,
  StytchProviderWrapper,
  WagmiProviderWrapper,
  RainbowKitProviderWrapper,
];
