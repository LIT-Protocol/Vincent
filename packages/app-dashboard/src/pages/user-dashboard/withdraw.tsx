import { useEffect, useState, useCallback } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';

import useAuthenticate from '@/components/consent/hooks/useAuthenticate';
import useAccounts from '@/components/consent/hooks/useAccounts';
import { registerWebAuthn, getSessionSigs } from '@/components/consent/utils/lit';
import LoginMethods from '@/components/consent/components/LoginMethods';
import { getAgentPKP } from '@/components/consent/utils/getAgentPKP';
import { useErrorPopup } from '@/providers/ErrorPopup';
import {
  useSetAuthInfo,
  useReadAuthInfo,
  useClearAuthInfo,
} from '@/components/consent/hooks/useAuthInfo';

import Loading from '@/components/consent/components/Loading';
import WithdrawForm from '@/components/withdraw/WithdrawForm';
import ExistingAccountView from '@/components/consent/views/ExistingAccountView';
import SignUpView from '@/components/consent/views/SignUpView';
export function Withdraw() {
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

  // ------ EXISTING SESSION HANDLING ------

  // Check for existing auth info
  const {
    authInfo,
    sessionSigs: validatedSessionSigs,
    isProcessing,
    error: readError,
  } = useReadAuthInfo();

  // State to show existing account option
  const [showExistingAccount, setShowExistingAccount] = useState(false);

  // Check for existing auth info once the validation process is complete
  useEffect(() => {
    if (isProcessing) return;
    if (validatedSessionSigs) {
      setShowExistingAccount(true);
    }
  }, [validatedSessionSigs, isProcessing]);

  // Handle using existing account
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
      // Wait briefly before changing the message
      const timeout = setTimeout(() => {
        setLoadingMessage(newMessage);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [authLoading, accountsLoading, sessionLoading, isProcessing, loadingMessage]);

  // ------ CLEANUP ------

  const handleSignOut = async () => {
    clearAuthInfo();
    window.location.reload();
  };

  useEffect(() => {
    return () => {
      // Cleanup web3 connection when component unmounts
      if (sessionSigs) {
        clearAuthInfo();
      }
    };
  }, [sessionSigs, clearAuthInfo]);

  // ------ RENDER CONTENT ------

  const renderContent = () => {
    // Handle loading states first
    if (authLoading || accountsLoading || sessionLoading || isProcessing) {
      return <Loading copy={loadingMessage} />;
    }

    // If we have existing auth info, show the option to use it
    if (showExistingAccount) {
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

      return (
        <div className="flex justify-center items-start w-full">
          <div className="w-[550px] position-relative mt-0">
            <WithdrawForm sessionSigs={sessionSigs} agentPKP={agentPKP} userPKP={userPKP} />
          </div>
        </div>
      );
    }

    // If we're not showing the existing account and have validated session sigs
    if (!showExistingAccount && validatedSessionSigs && authInfo?.userPKP) {
      return (
        <div className="flex justify-center items-start w-full">
          <div className="w-[550px] position-relative mt-0">
            <WithdrawForm
              sessionSigs={validatedSessionSigs}
              agentPKP={authInfo.agentPKP}
              userPKP={authInfo.userPKP}
            />
          </div>
        </div>
      );
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

export default Withdraw;
