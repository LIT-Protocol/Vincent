import RainbowKitProviderWrapper from '@/providers/RainbowKitProviderWrapper';
import StytchProviderWrapper from '@/providers/StytchProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';
import ReduxProvider from '@/providers/ReduxProvider';
import ThemeProvider from '@/providers/ThemeProvider';

export const AppProviders = [
  ThemeProvider,
  ReduxProvider,
  WagmiProviderWrapper,
  RainbowKitProviderWrapper,
];

export const UserProviders = [
  ThemeProvider,
  ReduxProvider,
  StytchProviderWrapper,
  WagmiProviderWrapper,
  RainbowKitProviderWrapper,
];
