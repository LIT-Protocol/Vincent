import { useEffect, useState, useCallback } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { useNavigate } from 'react-router-dom';
import { ThemeType } from './ui/theme';

import useAuthenticate from '../../../hooks/user-dashboard/useAuthenticate';
import useAccounts from '../../../hooks/user-dashboard/useAccounts';
import { registerWebAuthn, getSessionSigs } from '../../../utils/user-dashboard/lit';
import LoginMethods from '../auth/LoginMethods';
import { getAgentPKP } from '../../../utils/user-dashboard/getAgentPKP';
import {
  useSetAuthInfo,
  useReadAuthInfo,
  useClearAuthInfo,
} from '../../../hooks/user-dashboard/useAuthInfo';

import SignUpView from '../auth/SignUpView';
import StatusMessage from './StatusMessage';
import Loading from '@/components/shared/ui/Loading';

type ConsentViewProps = {
  isUserDashboardFlow?: boolean;
  theme: ThemeType;
};

export default function ConsentView({ isUserDashboardFlow = false, theme }: ConsentViewProps) {
  // ------ STATE AND HOOKS ------
  const { updateAuthInfo } = useSetAuthInfo();
  const { clearAuthInfo } = useClearAuthInfo();
  const navigate = useNavigate();

  // Shared state for session sigs and agent PKP
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [agentPKP, setAgentPKP] = useState<IRelayPKP>();
  const [sessionError, setSessionError] = useState<Error>();

  // Status message state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

  // Simplified loading state
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isStableLoading, setIsStableLoading] = useState(false);

  // ------ EXISTING SESSION HANDLING ------

  // Check for existing auth info
  const {
    authInfo,
    sessionSigs: validatedSessionSigs,
    isProcessing,
    error: readError,
  } = useReadAuthInfo();

  // State to show existing account option (used in non-user flow)
  const [showExistingAccount, setShowExistingAccount] = useState(false);

  // Check for existing auth info once the validation process is complete
  useEffect(() => {
    if (isProcessing) return;
    if (validatedSessionSigs) {
      if (isUserDashboardFlow) {
        // In user flow, automatically use existing account
        setSessionSigs(validatedSessionSigs);
      } else {
        // In consent flow, show option to use existing account
        setShowExistingAccount(true);
      }
    }
  }, [validatedSessionSigs, isProcessing, isUserDashboardFlow]);

  // ------ NEW AUTHENTICATION FLOW ------

  // Authentication state
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);

  // Authentication methods
  const {
    authMethod,
    authWithWebAuthn,
    authWithStytch,
    authWithEthWallet,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuthenticate();

  // Account handling
  const {
    fetchAccounts,
    setuserPKP,
    userPKP,
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts();

  // ------ NAVIGATION EFFECTS ------

  // Navigate when user has completed authentication with new PKP
  useEffect(() => {
    if (isUserDashboardFlow && userPKP && agentPKP && sessionSigs) {
      // Save the PKP info in localStorage for SessionValidator to use
      try {
        updateAuthInfo({
          agentPKP,
          userPKP,
        });
        // Navigate to apps page
        navigate('/user/apps');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setStatusMessage(`Authentication Error: ${errorMessage}`);
        setStatusType('error');
      }
    }
  }, [isUserDashboardFlow, userPKP, agentPKP, sessionSigs, updateAuthInfo, navigate]);

  // Navigate when user has existing validated session
  useEffect(() => {
    if (isUserDashboardFlow && validatedSessionSigs && authInfo?.userPKP) {
      // Redirect to /apps page
      navigate('/user/apps');
    }
  }, [isUserDashboardFlow, validatedSessionSigs, authInfo?.userPKP, navigate]);

  // Combine errors
  const error = authError || accountsError || sessionError || readError;

  // Show errors inline when they occur
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatusMessage(`Authentication Error: ${errorMessage}`);
      setStatusType('error');
    } else {
      setStatusMessage('');
    }
  }, [error]);

  // Register with WebAuthn
  async function handleRegisterWithWebAuthn() {
    const newPKP = await registerWebAuthn();
    if (newPKP) {
      setuserPKP(newPKP);
    }
  }

  // Generate session signatures on-demand
  const generateSessionSigs = useCallback(async () => {
    if (!authMethod || !userPKP) return;

    setSessionLoading(true);
    setSessionError(undefined);
    try {
      // Generate session signatures for the user PKP
      const sigs = await getSessionSigs({
        pkpPublicKey: userPKP.publicKey,
        authMethod,
      });
      setSessionSigs(sigs);

      // After getting user PKP session sigs, try to get the agent PKP
      try {
        const agentPkpInfo = await getAgentPKP(userPKP.ethAddress);
        setAgentPKP(agentPkpInfo);
      } catch (agentError) {
        console.error('Error handling Agent PKP:', agentError);
        setStatusMessage(`Agent PKP Error: ${agentError}`);
        setStatusType('error');
      }
    } catch (err) {
      setSessionError(err as Error);
    } finally {
      setSessionLoading(false);
    }
  }, [authMethod, userPKP, setSessionSigs, setAgentPKP, setSessionError, setSessionLoading]);

  // If user is authenticated, fetch accounts
  useEffect(() => {
    if (authMethod) {
      fetchAccounts(authMethod);
    }
  }, [authMethod, fetchAccounts]);

  // If user is authenticated and has accounts, select the first one
  useEffect(() => {
    if (authMethod && accounts.length > 0 && !userPKP) {
      setuserPKP(accounts[0]);
    }
  }, [authMethod, accounts, userPKP, setuserPKP]);

  // If user is authenticated and has selected an account, generate session sigs
  useEffect(() => {
    if (authMethod && userPKP) {
      generateSessionSigs();
    }
  }, [authMethod, userPKP, generateSessionSigs]);

  // ------ LOADING STATES ------

  useEffect(() => {
    const isLoading = authLoading || accountsLoading || sessionLoading || isProcessing;

    let currentMessage = '';
    if (authLoading) {
      currentMessage = 'Authenticating your credentials...';
    } else if (accountsLoading) {
      currentMessage = 'Fetching your Agent Wallet...';
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

  // ------ CLEANUP ------

  // Cleanup effect for consent flow
  useEffect(() => {
    // Only add the cleanup for the non-user flow
    if (!isUserDashboardFlow) {
      return () => {
        // Cleanup web3 connection when component unmounts
        if (sessionSigs) {
          clearAuthInfo();
        }
      };
    }
    return;
  }, [clearAuthInfo, sessionSigs, isUserDashboardFlow]);

  // ------ RENDER CONTENT ------

  const renderContent = () => {
    // Use the stable loading state
    if (isStableLoading) {
      return <Loading />;
    }

    // If authenticated with a new PKP and session sigs
    if (userPKP && agentPKP && sessionSigs) {
      // User flow: The navigation is handled in useEffect
      if (isUserDashboardFlow) {
        // Return loading state or empty component while navigation happens
        return <Loading />;
      }

      // Consent flow: save PKP info and refresh the page so ConsentPageWrapper can re-evaluate
      try {
        updateAuthInfo({
          agentPKP,
          userPKP,
        });
      } catch (error) {
        console.error('Error saving PKP info to localStorage:', error);
        setStatusMessage(`Authentication Error: ${error}`);
        setStatusType('error');
      }
      window.location.reload();
      return <Loading />;
    }

    // If we're not showing the existing account and have validated session sigs
    if (
      !isUserDashboardFlow &&
      !showExistingAccount &&
      validatedSessionSigs &&
      authInfo?.userPKP &&
      authInfo?.agentPKP
    ) {
      return (
        <div className="text-center py-8">
          <h1 className={`text-lg font-semibold ${theme.text}`}>Authentication Complete</h1>
          <p className={`text-sm ${theme.textMuted} mt-2`}>
            You have been successfully authenticated.
          </p>
        </div>
      );
    }

    // If we have validated session sigs from an existing session in user flow
    if (isUserDashboardFlow && validatedSessionSigs && authInfo?.userPKP) {
      // Return loading state or empty component while navigation happens
      return <Loading />;
    }

    // If authenticated but no accounts found
    if (authMethod && accounts.length === 0) {
      return (
        <SignUpView
          authMethodType={
            authMethod.authMethodType as (typeof AUTH_METHOD_TYPE)[keyof typeof AUTH_METHOD_TYPE]
          }
          handleRegisterWithWebAuthn={handleRegisterWithWebAuthn}
          authWithWebAuthn={authWithWebAuthn}
          theme={theme}
        />
      );
    }

    // Initial authentication state - show login methods
    return (
      <LoginMethods
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
