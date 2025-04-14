import React, { useEffect, useState } from 'react';
import { LitActionResource } from '@lit-protocol/auth-helpers';
import { LitPKPResource } from '@lit-protocol/auth-helpers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { validateSessionSigs } from '@lit-protocol/misc';
import { SessionSigs } from '@lit-protocol/types';
import Image from 'next/image';

import {
  cleanupSession,
  connectLitClient,
  litNodeClient,
} from '../utils/lit';
import AuthenticatedConsentForm from './AuthenticatedConsentForm';
import { useReadAuthInfo } from '../hooks/useAuthInfo';

// Wrapper component for centering content
const CenteredContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-20">
    {children}
  </div>
);

/**
 * A streamlined SessionValidator component that validates session signatures on mount
 */
const SessionValidator: React.FC = () => {
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [showExistingAccount, setShowExistingAccount] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);
  const authInfo = useReadAuthInfo();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Validate session once we have auth info
  useEffect(() => {
    // Skip if we've already checked the session or don't have auth info
    if (hasCheckedSession || !authInfo || !authInfo.agentPKP) return;

    const validateSession = async () => {
        try {
          // Check if lit-wallet-sig exists in localStorage first
          const litWalletSig = localStorage.getItem('lit-wallet-sig');
          if (!litWalletSig) {
            setHasCheckedSession(true);
            return; // Exit early if the key is missing
          }

          // Create lit resources for action execution and PKP signing
          const litResources = [
            new LitActionResource('*'),
            new LitPKPResource('*'),
          ];

          // Generate session key
          await connectLitClient();
          const sessionKey = await litNodeClient.getSessionKey();

          // Generate session capability object with wildcards
          const sessionCapabilityObject =
            await litNodeClient.generateSessionCapabilityObjectWithWildcards(
              litResources
            );

          // Get wallet signature
          const walletSig = await litNodeClient.getWalletSig({
            chain: 'ethereum',
            expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            sessionKey,
            sessionKeyUri: `lit:session:${sessionKey.publicKey}`,
            sessionCapabilityObject,
            nonce: Date.now().toString(),
          });

          if (walletSig) {
            const attemptedSessionSigs = await litNodeClient.getSessionSigs({
              capabilityAuthSigs: [walletSig],
              resourceAbilityRequests: [
                {
                  resource: new LitActionResource('*'),
                  ability: LIT_ABILITY.LitActionExecution,
                },
                {
                  resource: new LitPKPResource('*'),
                  ability: LIT_ABILITY.PKPSigning,
                },
              ],
              authNeededCallback: () => {
                return Promise.resolve(walletSig);
              },
            });

            // Store session sigs in state for later use
            setSessionSigs(attemptedSessionSigs);

            if(!attemptedSessionSigs) {
              setHasCheckedSession(true);
              return;
            }

            const validationResult = await validateSessionSigs(
              attemptedSessionSigs
            );

            // If validation is successful, show options (change from showing popup to showing existing account option)
            if (validationResult.isValid) {
              setShowExistingAccount(true);
            }
          }
        } catch (error) {
        console.error('Error validating session:', error);
      } finally {
        setHasCheckedSession(true);
      }
    };

    validateSession();
  }, [authInfo, hasCheckedSession]);

  // Handle user's choice to use existing account
  const handleUseExistingAccount = async () => {
    if (sessionSigs && authInfo?.agentPKP) {
      // Instead of doing the JWT creation here, show the consent form
      setShowExistingAccount(false);
      setShowConsentForm(true);
    } else {
      setShowExistingAccount(false);
    }
  };

  // Handle user's choice to sign out
  const handleSignOut = async () => {
    cleanupSession();
    setShowExistingAccount(false);
    // Reload the page to show the regular authentication form
    window.location.reload();
  };

  // Function to render auth method information
  const renderAuthMethodInfo = () => {
    if (!authInfo) return null;

    let methodName = '';
    let methodDetails = '';

    switch (authInfo.type) {
      case 'webauthn':
        methodName = 'WebAuthn Passkey';
        break;
      case 'email':
        methodName = 'Email OTP';
        methodDetails = authInfo.value ? `Email: ${authInfo.value}` : '';
        break;
      case 'phone':
        methodName = 'Phone OTP';
        methodDetails = authInfo.value ? `Phone: ${authInfo.value}` : '';
        break;
      default:
        methodName = authInfo.type;
    }

    const authTime = authInfo.authenticatedAt
      ? new Date(authInfo.authenticatedAt).toLocaleString()
      : 'Unknown time';

    // Get PKP Ethereum address for display
    const pkpEthAddress = authInfo.agentPKP?.ethAddress || 'Not available';

    return (
      <div className='auth-info'>
        <h4>Authentication Method</h4>
        <p>
          <strong>{methodName}</strong>
        </p>
        {methodDetails && <p>{methodDetails}</p>}
        <p className='auth-time'>Authenticated at: {authTime}</p>
        <div className='pkp-key'>
          <p>
            <strong>EVM Address:</strong>
          </p>
          <p className='pkp-key-value'>{pkpEthAddress}</p>
        </div>
      </div>
    );
  };

  // If showing consent form, render only that
  if (
    showConsentForm &&
    sessionSigs &&
    authInfo?.agentPKP &&
    authInfo?.userPKP
  ) {
    return (
      <CenteredContainer>
        <div className="w-full max-w-[550px]">
          <AuthenticatedConsentForm
            userPKP={authInfo.userPKP}
            agentPKP={authInfo.agentPKP}
            sessionSigs={sessionSigs}
            isSessionValidation={false}
          />
        </div>
      </CenteredContainer>
    );
  }

  // If showing existing account options, render them directly in a styled container
  if (showExistingAccount) {
    return (
      <CenteredContainer>
        <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center">
            <div className="h-8 w-8 rounded-md flex items-center justify-center">
              <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
            </div>
            <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-center mb-4">Use Existing Account?</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Would you like to use your existing authentication for this session?
            </p>
            
            {renderAuthMethodInfo()}
            
            <div className="flex flex-col space-y-3 mt-6">
              <button
                onClick={handleUseExistingAccount}
                className="bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yes, Use Existing Account
              </button>
              <button 
                onClick={handleSignOut} 
                className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No, Sign Out
              </button>
            </div>
          </div>
          
          <div className="px-6 py-3 text-center border-t border-gray-100">
            <p className="text-xs text-black flex items-center justify-center">
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <a href="https://litprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                Protected by <Image src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
              </a>
            </p>
          </div>
        </div>
      </CenteredContainer>
    );
  }

  // If not showing consent form or existing account options, render nothing
  return null;
};

export default SessionValidator;
