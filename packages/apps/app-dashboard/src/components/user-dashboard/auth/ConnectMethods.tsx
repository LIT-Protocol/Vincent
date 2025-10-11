import { Dispatch, SetStateAction } from 'react';
import { ThemeType } from '../connect/ui/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthView } from '../connect/Connect';

import AuthMethods from './AuthMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';
import EthWalletAuth from './EthWalletAuth';

interface ConnectProps {
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  authWithStytch: (
    sessionJwt: string,
    userId: string,
    method: 'email' | 'phone',
    userValue: string,
  ) => Promise<void>;
  authWithEthWallet: (
    address: string,
    signMessage: (message: string) => Promise<string>,
  ) => Promise<void>;
  registerWithWebAuthn?: (credentialId: string) => Promise<void>;
  clearError?: () => void;
  theme: ThemeType;
  view: AuthView;
  setView: (view: AuthView) => void;
}

export default function ConnectMethods({
  authWithWebAuthn,
  authWithStytch,
  authWithEthWallet,
  registerWithWebAuthn,
  clearError,
  theme,
  view,
  setView,
}: ConnectProps) {
  return (
    <AnimatePresence mode="wait">
      {view === 'default' && (
        <motion.div
          key="default"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <AuthMethods
            setView={setView as Dispatch<SetStateAction<string>>}
            clearError={clearError}
          />
        </motion.div>
      )}
      {view === 'email' && (
        <motion.div
          key="email"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <StytchOTP
            method="email"
            authWithStytch={authWithStytch}
            setView={setView as Dispatch<SetStateAction<string>>}
            theme={theme}
          />
        </motion.div>
      )}
      {view === 'phone' && (
        <motion.div
          key="phone"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <StytchOTP
            method="phone"
            authWithStytch={authWithStytch}
            setView={setView as Dispatch<SetStateAction<string>>}
            theme={theme}
          />
        </motion.div>
      )}
      {view === 'wallet' && (
        <motion.div
          key="wallet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <EthWalletAuth
            authWithEthWallet={authWithEthWallet}
            setView={setView as Dispatch<SetStateAction<string>>}
            theme={theme}
          />
        </motion.div>
      )}
      {view === 'webauthn' && (
        <motion.div
          key="webauthn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <WebAuthn
            authWithWebAuthn={authWithWebAuthn}
            registerWithWebAuthn={registerWithWebAuthn}
            setView={setView as Dispatch<SetStateAction<string>>}
            clearError={clearError}
            theme={theme}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
