import { useEffect, useState, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { SessionSigs } from '@lit-protocol/types';
import { ThemeType } from './ui/theme';

import useAuthenticate from '@/hooks/user-dashboard/useAuthenticate';
import useAccounts from '@/hooks/user-dashboard/useAccounts';
import { registerWebAuthn, getSessionSigs } from '@/utils/user-dashboard/lit';
import { useSetAuthInfo, ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import ConnectMethods from '../auth/ConnectMethods';

import SignUpView from '../auth/SignUpView';
import StatusMessage from './StatusMessage';
import Loading from '@/components/shared/ui/Loading';

type ConnectViewProps = {
  theme: ThemeType;
  readAuthInfo: ReadAuthInfo;
};

export default function ConnectView({ theme, readAuthInfo }: ConnectViewProps) {
  // ------ STATE AND HOOKS ------
  const { setAuthInfo } = useSetAuthInfo();

  // Shared state for session sigs and agent PKP
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [sessionError, setSessionError] = useState<Error>();

  // Status message state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

  // Simplified loading state
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isStableLoading, setIsStableLoading] = useState(false);

  // ------ EXISTING SESSION HANDLING ------

  // Use the passed-in auth info
  const {
    authInfo,
    sessionSigs: validatedSessionSigs,
    isProcessing,
    error: readError,
  } = readAuthInfo;

  // ------ NEW AUTHENTICATION FLOW ------

  // Authentication state
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);

  // Authentication methods
  const {
    authData,
    authWithWebAuthn,
    authWithStytch,
    authWithEthWallet,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuthenticate();

  // Account handling
  const {
    fetchOrMintAccounts,
    setuserPKP,
    userPKP,
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts();

  // Combine errors
  const error = authError || accountsError || sessionError || readError;

  // Show errors inline when they occur
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Don't show error for user rejection - it's not really an error
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        // User cancelled authentication - no action needed
      } else {
        // Capture the error with full breadcrumb trail
        Sentry.captureException(error, {
          extra: {
            context: 'Connect.authentication',
            errorSource: authError
              ? 'authentication'
              : accountsError
                ? 'accounts'
                : sessionError
                  ? 'session'
                  : 'readAuth',
          },
        });
        setStatusMessage(`Authentication Error: ${errorMessage}`);
        setStatusType('error');
      }
    } else {
      setStatusMessage('');
    }
  }, [error, authError, accountsError, sessionError, readError]);

  // Register with WebAuthn
  async function handleRegisterWithWebAuthn(displayName: string) {
    try {
      const newPKP = await registerWebAuthn(displayName);
      if (newPKP) {
        setuserPKP(newPKP);
      }
    } catch (error) {
      // Error will be logged by the effect that monitors authError/accountsError
      // The registerWebAuthn error is already breadcrumbed in lit.ts
      console.error('Failed to register WebAuthn:', error);
      Sentry.captureException(error, {
        extra: {
          context: 'Connect.registerWebAuthn',
          displayName,
        },
      });
      setStatusMessage(
        `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      setStatusType('error');
    }
  }

  // Generate session signatures on-demand
  const generateSessionSigs = useCallback(async () => {
    if (!authData || !userPKP) return;

    setSessionLoading(true);
    setSessionError(undefined);
    try {
      // Generate session signatures for the user PKP
      const sigs = await getSessionSigs({
        pkpPublicKey: userPKP.publicKey,
        authMethod: authData.authMethod,
      });
      setSessionSigs(sigs);
    } catch (err) {
      setSessionError(err as Error);
    } finally {
      setSessionLoading(false);
    }
  }, [authData, userPKP, setSessionSigs, setSessionError, setSessionLoading]);

  // If user is authenticated, fetch accounts
  useEffect(() => {
    if (authData) {
      fetchOrMintAccounts(authData.authMethod);
    }
  }, [authData, fetchOrMintAccounts]);

  // If user is authenticated and has accounts, select the first one
  useEffect(() => {
    if (authData && accounts.length > 0) {
      setuserPKP(accounts[0]);
    }
  }, [authData, accounts, setuserPKP]);

  // If user is authenticated and has selected an account, generate session sigs
  useEffect(() => {
    if (authData && userPKP && accounts.length > 0) {
      generateSessionSigs();
    }
  }, [authData, userPKP, accounts, generateSessionSigs]);

  // Save complete auth info when we have authData, userPKP and sessionSigs (ATOMIC)
  useEffect(() => {
    if (authData && userPKP && sessionSigs) {
      try {
        // Determine auth type based on authMethod
        let authType = 'unknown';

        if (authData.authMethod.authMethodType === AUTH_METHOD_TYPE.EthWallet) {
          authType = 'wallet';
        } else if (authData.authMethod.authMethodType === AUTH_METHOD_TYPE.StytchEmailFactorOtp) {
          authType = 'email';
        } else if (authData.authMethod.authMethodType === AUTH_METHOD_TYPE.StytchSmsFactorOtp) {
          authType = 'phone';
        } else if (authData.authMethod.authMethodType === AUTH_METHOD_TYPE.WebAuthn) {
          authType = 'webauthn';
        } else {
          console.warn('Unknown auth method type:', authData.authMethod.authMethodType);
        }

        // Save everything together - no intermediate states!
        setAuthInfo({
          type: authType,
          value: authData.userValue, // Use the user-entered value
          userPKP,
          authenticatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error saving complete auth info:', error);
        setStatusMessage(`Authentication Error: ${error}`);
        setStatusType('error');
      }
    }
  }, [authData, userPKP, sessionSigs, setAuthInfo]);

  // ------ LOADING STATES ------

  useEffect(() => {
    const isLoading = authLoading || accountsLoading || sessionLoading || isProcessing;

    let currentMessage = '';
    if (authLoading) {
      currentMessage = 'Authenticating...';
    } else if (accountsLoading) {
      currentMessage = 'Fetching your Vincent Wallet...';
    } else if (sessionLoading) {
      currentMessage = 'Securing your session...';
    } else if (isProcessing) {
      currentMessage = 'Checking existing session...';
    }

    if (isLoading) {
      setIsStableLoading(true);
      if (currentMessage && currentMessage !== loadingMessage) {
        setLoadingMessage(currentMessage);
      }
      return;
    } else {
      const timer = setTimeout(() => {
        setIsStableLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [authLoading, accountsLoading, sessionLoading, isProcessing, loadingMessage]);

  // ------ RENDER CONTENT ------

  const renderContent = () => {
    // Use the stable loading state
    if (isStableLoading) {
      return <Loading text={loadingMessage} />;
    }

    // If authenticated with a new PKP and session sigs
    if (userPKP && sessionSigs) {
      // Connect flow: PKP info is saved via useEffect above
      return <Loading text="Finalizing authentication..." />;
    }

    // If we have validated session sigs from existing auth, show completion message
    if (validatedSessionSigs && authInfo?.userPKP) {
      return (
        <div className="text-center py-8">
          <h1 className={`text-lg font-semibold ${theme.text}`}>Authentication Complete</h1>
          <p className={`text-sm ${theme.textMuted} mt-2`}>
            You have been successfully authenticated.
          </p>
        </div>
      );
    }

    // If authenticated but no accounts found
    if (authData && accounts.length === 0) {
      return (
        <SignUpView
          authMethodType={
            authData.authMethod
              .authMethodType as (typeof AUTH_METHOD_TYPE)[keyof typeof AUTH_METHOD_TYPE]
          }
          handleRegisterWithWebAuthn={handleRegisterWithWebAuthn}
          authWithWebAuthn={authWithWebAuthn}
          theme={theme}
        />
      );
    }

    // Initial authentication state - show connect methods
    return (
      <ConnectMethods
        authWithWebAuthn={authWithWebAuthn}
        authWithStytch={authWithStytch}
        authWithEthWallet={authWithEthWallet}
        registerWithWebAuthn={handleRegisterWithWebAuthn}
        clearError={clearError}
        theme={theme}
      />
    );
  };

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div className="mb-4">
          <StatusMessage message={statusMessage} type={statusType} />
        </div>
      )}

      <div className="">{renderContent()}</div>
    </div>
  );
}
