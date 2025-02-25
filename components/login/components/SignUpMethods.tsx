import { useState, Dispatch, SetStateAction } from 'react';
import AuthMethods from './AuthMethods';
import WalletMethods from './WalletMethods';
import WebAuthn from './WebAuthn';
// import StytchOTP from './StytchOTP';

interface SignUpProps {
  authWithEthWallet: (address: string) => Promise<void>;
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  // authWithStytch: (sessionJwt: string, userId: string, method: 'email' | 'phone') => Promise<void>;
  registerWithWebAuthn: (credentialId: string) => Promise<void>;
  goToLogin: () => void;
  error?: Error;
}

type AuthView = 'default' | 'email' | 'phone' | 'wallet' | 'webauthn';
type SetViewFunction = Dispatch<SetStateAction<AuthView>>;

export default function SignUpMethods({
  authWithEthWallet,
  authWithWebAuthn,
  // authWithStytch,
  registerWithWebAuthn,
  goToLogin,
  error,
}: SignUpProps) {
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
            <h1>Sign Up</h1>
            {/* <p>
              Create a Lit Agent Wallet that is secured by accounts you already have.
            </p> */}
            <AuthMethods setView={setView as Dispatch<SetStateAction<string>>} />
            <div className="buttons-container">
              <button
                type="button"
                className="btn btn--link"
                onClick={goToLogin}
              >
                Have an account? Log in
              </button>
            </div>
          </>
        )}
        {/* {view === 'email' && (
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
        )} */}
        {view === 'wallet' && (
          <WalletMethods
            authWithEthWallet={authWithEthWallet}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
        {view === 'webauthn' && (
          <WebAuthn
            start="register"
            authWithWebAuthn={authWithWebAuthn}
            registerWithWebAuthn={registerWithWebAuthn}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
      </div>
    </div>
  );
}
