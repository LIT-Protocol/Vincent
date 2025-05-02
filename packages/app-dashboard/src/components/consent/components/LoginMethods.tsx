import { useState, Dispatch, SetStateAction } from 'react';

import ProtectedByLit from '@/components/layout/ProtectedByLit';
import AuthMethods from './AuthMethods';
import WalletMethods from './WalletMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';
import ConnectWithVincent from '@/components/layout/ConnectWithVincent';

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
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <ConnectWithVincent />

      <div className="p-6">
        {view === 'default' && (
          <>
            <div className="flex flex-col items-center mb-6">
              <img
                src="/vincent-logo.png"
                alt="Vincent Logo"
                width={120}
                height={36}
                className="mb-3"
              />
              <h1 className="text-xl font-semibold text-center text-gray-800">
                Agent Wallet Authentication
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Access or create your Vincent Agent Wallet
              </p>
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

      <ProtectedByLit />
    </div>
  );
}
