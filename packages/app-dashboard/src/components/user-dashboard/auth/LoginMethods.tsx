import { useState, Dispatch, SetStateAction } from 'react';

import AuthMethods from './AuthMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';
import EthWalletAuth from './EthWalletAuth';

interface LoginProps {
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  authWithStytch: (sessionJwt: string, userId: string, method: 'email' | 'phone') => Promise<void>;
  authWithEthWallet: (
    address: string,
    signMessage: (message: string) => Promise<string>,
  ) => Promise<void>;
  registerWithWebAuthn?: (credentialId: string) => Promise<void>;
  clearError?: () => void;
}

type AuthView = 'default' | 'email' | 'phone' | 'wallet' | 'webauthn';

export default function LoginMethods({
  authWithWebAuthn,
  authWithStytch,
  authWithEthWallet,
  registerWithWebAuthn,
  clearError,
}: LoginProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <>
      {view === 'default' && (
        <>
          <AuthMethods setView={setView as Dispatch<SetStateAction<string>>} />
        </>
      )}
      {view === 'email' && (
        <StytchOTP
          method="email"
          authWithStytch={authWithStytch}
          setView={setView as Dispatch<SetStateAction<string>>}
        />
      )}
      {view === 'phone' && (
        <StytchOTP
          method="phone"
          authWithStytch={authWithStytch}
          setView={setView as Dispatch<SetStateAction<string>>}
        />
      )}
      {view === 'wallet' && (
        <EthWalletAuth
          authWithEthWallet={authWithEthWallet}
          setView={setView as Dispatch<SetStateAction<string>>}
        />
      )}
      {view === 'webauthn' && (
        <WebAuthn
          authWithWebAuthn={authWithWebAuthn}
          registerWithWebAuthn={registerWithWebAuthn}
          setView={setView as Dispatch<SetStateAction<string>>}
          clearError={clearError}
        />
      )}
    </>
  );
}
