import ErrorPopupProvider from '@/providers/ErrorPopup';
import RainbowKitProviderWrapper from '@/providers/RainbowKitProviderWrapper';
import StytchProviderWrapper from '@/providers/StytchProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';

export const AppProviders = [
  WagmiProviderWrapper,
  RainbowKitProviderWrapper,
  ErrorPopupProvider,
];

export const UserProviders = [
  StytchProviderWrapper,
  ErrorPopupProvider,
];
