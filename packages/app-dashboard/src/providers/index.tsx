import ErrorPopupProvider from '@/providers/ErrorPopup';
import RainbowKitProviderWrapper from '@/providers/RainbowKitProviderWrapper';
import StytchProviderWrapper from '@/providers/StytchProviderWrapper';
import WagmiProviderWrapper from '@/providers/WagmiProviderWrapper';
import ReduxProvider from '@/providers/ReduxProvider';

export const AppProviders = [
  ReduxProvider,
  WagmiProviderWrapper,
  RainbowKitProviderWrapper,
  ErrorPopupProvider,
];

export const UserProviders = [ReduxProvider, StytchProviderWrapper, ErrorPopupProvider];
