"use client";

import { useEffect, useState, useCallback } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';

import useAuthenticate from '../hooks/useAuthenticate';
import useAccounts from '../hooks/useAccounts';
import { registerWebAuthn, getSessionSigs, cleanupSession } from '../utils/lit';
import AuthenticatedConsentForm from '../components/AuthenticatedConsentForm';
import Loading from '../components/Loading';
import LoginMethods from '../components/LoginMethods';
import { getAgentPKP } from '../utils/getAgentPKP';

export default function IndexView() {
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [agentPKP, setAgentPKP] = useState<IRelayPKP>();
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<Error>();

  const {
    authMethod,
    authWithEthWallet,
    authWithWebAuthn,
    authWithStytch,
    loading: authLoading,
    error: authError,
  } = useAuthenticate();
  const {
    fetchAccounts,
    setuserPKP,
    userPKP,
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts();

  const error = authError || accountsError || sessionError;

  // Store referrer URL when component mounts
  useEffect(() => {
    // Get the document referrer (the URL the user came from)
    const referrer = document.referrer;
    if (referrer && referrer !== '') {
      sessionStorage.setItem('referrerUrl', referrer);
    }
  }, []);

  // Function to generate session signatures on-demand
  const generateSessionSigs = useCallback(async () => {
    if (!authMethod || !userPKP) return;

    setSessionLoading(true);
    setSessionError(undefined);
    try {
      // Generate session signatures for the user PKP
      const sigs = await getSessionSigs({
        pkpPublicKey: userPKP.publicKey,
        authMethod
      });
      setSessionSigs(sigs);

      // After getting user PKP session sigs, try to get the agent PKP
      try {
        const agentPkpInfo = await getAgentPKP(userPKP.ethAddress);
        setAgentPKP(agentPkpInfo);
      } catch (agentError) {
        console.error('Error handling Agent PKP:', agentError);
      }
    } catch (err) {
      setSessionError(err as Error);
    } finally {
      setSessionLoading(false);
    }
  }, [authMethod, userPKP, setSessionSigs, setAgentPKP, setSessionError, setSessionLoading]);

  async function handleRegisterWithWebAuthn() {
    const newPKP = await registerWebAuthn();
    if (newPKP) {
      setuserPKP(newPKP);
    }
  }

  useEffect(() => {
    // If user is authenticated, fetch accounts
    if (authMethod) {
      fetchAccounts(authMethod);
    }
  }, [authMethod, fetchAccounts]);

  useEffect(() => {
    // If user is authenticated and has accounts, select the first one
    if (authMethod && accounts.length > 0 && !userPKP) {
      setuserPKP(accounts[0]);
    }
  }, [authMethod, accounts, userPKP, setuserPKP]);

  useEffect(() => {
    // If user is authenticated and has selected an account, generate session sigs
    if (authMethod && userPKP) {
      generateSessionSigs();
    }
  }, [authMethod, userPKP, generateSessionSigs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup web3 connection when component unmounts
      if (sessionSigs) {
        cleanupSession();
      }
    };
  }, [sessionSigs]);

  // Loading states
  if (authLoading) {
    return <Loading copy={'Authenticating your credentials...'} error={error} />;
  }
  if (accountsLoading) {
    return <Loading copy={'Looking up your accounts...'} error={error} />;
  }
  if (sessionLoading) {
    return <Loading copy={'Securing your session...'} error={error} />;
  }

  // Authenticated states
  if (userPKP && sessionSigs) {
    // Save the PKP info in localStorage for SessionValidator to use
    try {
      const storedAuthInfo = localStorage.getItem('lit-auth-info');
      if (storedAuthInfo) {
        const authInfo = JSON.parse(storedAuthInfo);

        // Add PKP info to the existing auth info
        authInfo.agentPKP = agentPKP;
        authInfo.userPKP = userPKP;
        localStorage.setItem('lit-auth-info', JSON.stringify(authInfo));
        console.log('Updated auth info with PKP public keys:', authInfo);
      }
    } catch (error) {
      console.error('Error saving PKP info to localStorage:', error);
    }

    return (
      <div className="consent-form-overlay">
        <div className="consent-form-modal">
          <AuthenticatedConsentForm
            userPKP={userPKP}
            sessionSigs={sessionSigs}
            agentPKP={agentPKP}
          />
        </div>
      </div>
    );
  }

  // No accounts found state
  if (authMethod && accounts.length === 0) {
    switch (authMethod.authMethodType) {
      case AUTH_METHOD_TYPE.WebAuthn:
        return (
          <div className="container">
            <div className="wrapper">
              <h1>No Accounts Found</h1>
              <p>You don&apos;t have any accounts associated with this WebAuthn credential.</p>
              <div className="auth-options">
                <div className="auth-option">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={handleRegisterWithWebAuthn}
                  >
                    Create New Account
                  </button>
                </div>
                <div className="auth-option">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => authWithWebAuthn()}
                  >
                    Try Sign In Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case AUTH_METHOD_TYPE.StytchEmailFactorOtp:
      case AUTH_METHOD_TYPE.StytchSmsFactorOtp:
        return <Loading copy={'Creating your account...'} error={error} />;

      case AUTH_METHOD_TYPE.EthWallet:
        return (
          <div className="container">
            <div className="wrapper">
              <h1>No Accounts Found</h1>
              <p>No accounts were found for this wallet address.</p>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="container">
            <div className="wrapper">
              <h1>Unsupported Authentication Method</h1>
              <p>The authentication method you&apos;re using is not supported.</p>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => window.location.reload()}
              >
                Start Over
              </button>
            </div>
          </div>
        );
    }
  }

  // Initial authentication state
  return (
    <LoginMethods
      authWithEthWallet={authWithEthWallet}
      authWithWebAuthn={authWithWebAuthn}
      authWithStytch={authWithStytch}
      registerWithWebAuthn={handleRegisterWithWebAuthn}
    />
  );
} 