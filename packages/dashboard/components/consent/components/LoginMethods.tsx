import { useState, Dispatch, SetStateAction } from 'react';

import AuthMethods from './AuthMethods';
import WalletMethods from './WalletMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';

interface LoginProps {
  authWithEthWallet: (address: string) => Promise<void>;
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  authWithStytch: (sessionJwt: string, userId: string, method: 'email' | 'phone') => Promise<void>;
  registerWithWebAuthn?: (credentialId: string) => Promise<void>;
}

type AuthView = 'default' | 'email' | 'phone' | 'wallet' | 'webauthn';

export default function LoginMethods({
  authWithEthWallet,
  authWithWebAuthn,
  authWithStytch,
  registerWithWebAuthn,
}: LoginProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <div className="container">
      <div className="wrapper">
        {view === 'default' && (
          <>
            <h1>Lit Agent Wallet Management</h1>
            <p>Access or create your Lit Agent Wallet.</p>
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
          <WalletMethods
            authWithEthWallet={authWithEthWallet}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
        {view === 'webauthn' && (
          <WebAuthn
            authWithWebAuthn={authWithWebAuthn}
            registerWithWebAuthn={registerWithWebAuthn}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
      </div>
    </div>
  );
}
