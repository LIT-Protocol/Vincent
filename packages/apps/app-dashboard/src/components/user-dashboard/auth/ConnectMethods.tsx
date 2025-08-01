import { useState, Dispatch, SetStateAction } from 'react';
import { ThemeType } from '../connect/ui/theme';

import AuthMethods from './AuthMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';
import EthWalletAuth from './EthWalletAuth';

interface ConnectProps {
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  authWithStytch: (sessionJwt: string, userId: string, method: 'email' | 'phone') => Promise<void>;
  authWithEthWallet: (
    address: string,
    signMessage: (message: string) => Promise<string>,
  ) => Promise<void>;
  registerWithWebAuthn?: (credentialId: string) => Promise<void>;
  clearError?: () => void;
  theme: ThemeType;
}

type AuthView = 'default' | 'email' | 'phone' | 'wallet' | 'webauthn';

export default function ConnectMethods({
  authWithWebAuthn,
  authWithStytch,
  authWithEthWallet,
  registerWithWebAuthn,
  clearError,
  theme,
}: ConnectProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <>
      {view === 'default' && (
        <>
          <AuthMethods setView={setView as Dispatch<SetStateAction<string>>} theme={theme} />
        </>
      )}
      {view === 'email' && (
        <StytchOTP
          method="email"
          authWithStytch={authWithStytch}
          setView={setView as Dispatch<SetStateAction<string>>}
          theme={theme}
        />
      )}
      {view === 'phone' && (
        <StytchOTP
          method="phone"
          authWithStytch={authWithStytch}
          setView={setView as Dispatch<SetStateAction<string>>}
          theme={theme}
        />
      )}
      {view === 'wallet' && (
        <EthWalletAuth
          authWithEthWallet={authWithEthWallet}
          setView={setView as Dispatch<SetStateAction<string>>}
          theme={theme}
        />
      )}
      {view === 'webauthn' && (
        <WebAuthn
          authWithWebAuthn={authWithWebAuthn}
          registerWithWebAuthn={registerWithWebAuthn}
          setView={setView as Dispatch<SetStateAction<string>>}
          clearError={clearError}
          theme={theme}
        />
      )}
    </>
  );
}
