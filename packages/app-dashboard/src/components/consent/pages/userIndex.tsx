'use client';

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

import SignUpView from '../views/SignUpView';
import Loading from '../components/Loading';
import { useErrorPopup } from '@/providers/ErrorPopup';

export default function ConsentView() {
  // ------ STATE AND HOOKS ------
  const { showError } = useErrorPopup();
  const { updateAuthInfo } = useSetAuthInfo();
  const { clearAuthInfo } = useClearAuthInfo();

  // Shared state for session sigs and agent PKP
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [agentPKP, setAgentPKP] = useState<IRelayPKP>();
  const [sessionError, setSessionError] = useState<Error>();

  // State for loading messages
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  // ------ EXISTING SESSION HANDLING ------

  // Check for existing auth info
  const {
    authInfo,
    sessionSigs: validatedSessionSigs,
    isProcessing,
    error: readError,
  } = useReadAuthInfo();

  // Automatically use existing account instead of showing confirmation
  useEffect(() => {
    if (isProcessing) return;
    if (validatedSessionSigs) {
      // Instead of showing confirmation, just set the session sigs directly
      setSessionSigs(validatedSessionSigs);
    }
  }, [validatedSessionSigs, isProcessing]);

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

  // Expose the handleSignOut function through the component
  (ConsentView as any).handleSignOut = handleSignOut;

  // ------ RENDER CONTENT ------

  const renderContent = () => {
    // Handle loading states first
    if (authLoading || accountsLoading || sessionLoading || isProcessing) {
      return <Loading copy={loadingMessage} isTransitioning={isTransitioning} />;
    }

    // If authenticated with session sigs (either from existing auth or new login)
    if (userPKP && sessionSigs) {
      // Save the PKP info in localStorage for SessionValidator to use
      try {
        updateAuthInfo({
          agentPKP,
          userPKP,
        });

        navigate('/user/apps');
        return;
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

    // If we have validated session sigs from an existing session
    if (validatedSessionSigs && authInfo?.userPKP) {
      // Redirect to /apps page
      navigate('/user/apps');
      return;
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
