import { useEffect, useState, useCallback } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { useNavigate } from 'react-router-dom';

import useAuthenticate from '../hooks/useAuthenticate';
import useAccounts from '../hooks/useAccounts';
import { registerWebAuthn, getSessionSigs } from '../utils/lit';
import LoginMethods from '../components/LoginMethods';
import { getAgentPKP } from '../utils/getAgentPKP';
import { useSetAuthInfo, useReadAuthInfo, useClearAuthInfo } from '../hooks/useAuthInfo';

import ExistingAccountView from '../views/ExistingAccountView';
import AuthenticatedConsentForm from '../components/AuthenticatedConsentForm';
import SignUpView from '../views/SignUpView';
import Loading from '../components/Loading';
import { useErrorPopup } from '@/providers/ErrorPopup';

type ConsentViewProps = {
  isUserDashboardFlow?: boolean;
};

export default function ConsentView({ isUserDashboardFlow = false }: ConsentViewProps) {
  // ------ STATE AND HOOKS ------
  const { showError } = useErrorPopup();
  const { updateAuthInfo } = useSetAuthInfo();
  const { clearAuthInfo } = useClearAuthInfo();
  const navigate = useNavigate();

  // Shared state for session sigs and agent PKP
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [agentPKP, setAgentPKP] = useState<IRelayPKP>();
  const [sessionError, setSessionError] = useState<Error>();

  // State for loading messages
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Handle using existing account (used in non-user flow)
  const handleUseExistingAccount = () => {
    setShowExistingAccount(false);
  };

  // ------ NEW AUTHENTICATION FLOW ------

  // Authentication state
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);

  // Authentication methods
  const {
    authMethod,
    authWithEthWallet,
    authWithWebAuthn,
    authWithStytch,
    loading: authLoading,
    error: authError,
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

  // Combine errors
  const error = authError || accountsError || sessionError || readError;

  // Show errors in the popup when they occur
  useEffect(() => {
    if (error) {
      showError(error, 'Authentication Error');
    }
  }, [error, showError]);

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
        showError(agentError as Error, 'Agent PKP Error');
      }
    } catch (err) {
      setSessionError(err as Error);
    } finally {
      setSessionLoading(false);
    }
  }, [
    authMethod,
    userPKP,
    setSessionSigs,
    setAgentPKP,
    setSessionError,
    setSessionLoading,
    showError,
  ]);

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

  // Update loading message based on current state with smooth transitions
  useEffect(() => {
    // Determine the appropriate message based on current loading state
    let newMessage = '';
    if (authLoading) {
      newMessage = 'Authenticating your credentials...';
    } else if (accountsLoading) {
      newMessage = 'Fetching your Agent Wallet...';
    } else if (sessionLoading) {
      newMessage = 'Securing your session...';
    } else if (isProcessing) {
      newMessage = 'Checking existing session...';
    }

    // Only transition if the message is actually changing and not empty
    if (newMessage && newMessage !== loadingMessage) {
      // Start the transition
      setIsTransitioning(true);

      // Wait briefly before changing the message
      const timeout = setTimeout(() => {
        setLoadingMessage(newMessage);

        // After changing message, end the transition
        setTimeout(() => {
          setIsTransitioning(false);
        }, 150);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [authLoading, accountsLoading, sessionLoading, isProcessing, loadingMessage]);

  // ------ CLEANUP ------

  const handleSignOut = async () => {
    await clearAuthInfo();
    window.location.reload();
  };

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
  }, [clearAuthInfo, sessionSigs, isUserDashboardFlow]);

  // ------ RENDER CONTENT ------

  const renderContent = () => {
    // Handle loading states first
    if (authLoading || accountsLoading || sessionLoading || isProcessing) {
      return <Loading copy={loadingMessage} isTransitioning={isTransitioning} />;
    }

    // If we have existing auth info and we're not in user flow, show the option to use it
    if (!isUserDashboardFlow && showExistingAccount) {
      return (
        <ExistingAccountView
          authInfo={authInfo}
          handleUseExistingAccount={handleUseExistingAccount}
          handleSignOut={handleSignOut}
        />
      );
    }

    // If authenticated with a new PKP and session sigs
    if (userPKP && sessionSigs) {
      // Save the PKP info in localStorage for SessionValidator to use
      try {
        updateAuthInfo({
          agentPKP,
          userPKP,
        });

        // User flow: navigate to apps page
        if (isUserDashboardFlow) {
          navigate('/user/apps');
          return <></>;
        }

        // Consent flow: show the consent form
        return (
          <AuthenticatedConsentForm
            userPKP={userPKP}
            sessionSigs={sessionSigs}
            agentPKP={agentPKP}
          />
        );
      } catch (error) {
        console.error('Error saving PKP info to localStorage:', error);
        showError(error as Error, 'Authentication Error');
        return (
          <LoginMethods
            authWithEthWallet={authWithEthWallet}
            authWithWebAuthn={authWithWebAuthn}
            authWithStytch={authWithStytch}
            registerWithWebAuthn={handleRegisterWithWebAuthn}
          />
        );
      }
    }

    // If we're not showing the existing account and have validated session sigs
    if (!isUserDashboardFlow && !showExistingAccount && validatedSessionSigs && authInfo?.userPKP) {
      return (
        <AuthenticatedConsentForm
          userPKP={authInfo.userPKP}
          sessionSigs={validatedSessionSigs}
          agentPKP={authInfo.agentPKP}
        />
      );
    }

    // If we have validated session sigs from an existing session in user flow
    if (isUserDashboardFlow && validatedSessionSigs && authInfo?.userPKP) {
      // Redirect to /apps page
      navigate('/user/apps');
      return <></>;
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
        />
      );
    }

    // Initial authentication state - show login methods
    return (
      <LoginMethods
        authWithEthWallet={authWithEthWallet}
        authWithWebAuthn={authWithWebAuthn}
        authWithStytch={authWithStytch}
        registerWithWebAuthn={handleRegisterWithWebAuthn}
      />
    );
  };

  return <div className="grow flex items-center justify-center">{renderContent()}</div>;
}
