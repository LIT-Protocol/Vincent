import { useState, Dispatch, SetStateAction } from 'react';

import AuthMethods from './AuthMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';

interface LoginProps {
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  authWithStytch: (sessionJwt: string, userId: string, method: 'email' | 'phone') => Promise<void>;
  registerWithWebAuthn?: (credentialId: string) => Promise<void>;
}

type AuthView = 'default' | 'email' | 'phone' | 'wallet' | 'webauthn';

export default function LoginMethods({
  authWithWebAuthn,
  authWithStytch,
  registerWithWebAuthn,
}: LoginProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <>
      {view === 'default' && (
        <>
          <div className="flex flex-col items-center mb-6">
            <img
              src="/vincent-by-lit-logo.png"
              alt="Vincent Logo"
              width={120}
              height={36}
              className="mb-3"
            />
            <h1 className="text-xl font-semibold text-center text-gray-800">
              Agent Wallet Authentication
            </h1>
            <p className="text-sm text-gray-600 mt-2">Access or create your Vincent Agent Wallet</p>
          </div>
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
      {view === 'webauthn' && (
        <WebAuthn
          authWithWebAuthn={authWithWebAuthn}
          registerWithWebAuthn={registerWithWebAuthn}
          setView={setView as Dispatch<SetStateAction<string>>}
        />
      )}
    </>
  );
}
