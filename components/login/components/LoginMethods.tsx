import { useState, Dispatch, SetStateAction } from 'react';

import "../styles/login.css";
import AuthMethods from './AuthMethods';
import WalletMethods from './WalletMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';

interface LoginProps {
  authWithEthWallet: (address: string) => Promise<void>;
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  authWithStytch: (sessionJwt: string, userId: string, method: 'email' | 'phone') => Promise<void>;
  signUp: () => void;
  error?: Error;
}

type AuthView = 'default' | 'email' | 'phone' | 'wallet' | 'webauthn';
type SetViewFunction = Dispatch<SetStateAction<AuthView>>;

export default function LoginMethods({
  authWithEthWallet,
  authWithWebAuthn,
  authWithStytch,
  signUp,
  error,
}: LoginProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <div className="container login-page">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        {view === 'default' && (
          <>
            <h1>Log In</h1>
            {/* <p>Access your Lit Agent Wallet.</p> */}
            <AuthMethods setView={setView as Dispatch<SetStateAction<string>>} />
            <div className="buttons-container">
              <button type="button" className="btn btn--link" onClick={signUp}>
                Need an account? Sign up
              </button>
            </div>
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
            start="authenticate"
            authWithWebAuthn={authWithWebAuthn}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
      </div>
    </div>
  );
}
