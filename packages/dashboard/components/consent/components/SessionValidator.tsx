import React, { useEffect, useState } from 'react';
import { LitActionResource } from '@lit-protocol/auth-helpers';
import { LitPKPResource } from '@lit-protocol/auth-helpers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { validateSessionSigs } from '@lit-protocol/misc';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import * as ethers from 'ethers';

import { cleanupSession, litNodeClient } from '../utils/lit';
import AuthenticatedConsentForm from './AuthenticatedConsentForm';


// Define interfaces for the authentication info
interface AuthInfo {
  type: string;
  authenticatedAt: string;
  agentPKP?: IRelayPKP;
  userPKP?: IRelayPKP;
  value?: string;
}

/**
 * A streamlined SessionValidator component that validates session signatures on mount
 */
const SessionValidator: React.FC = () => {
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Check for auth info on mount
  useEffect(() => {
    try {
      const storedAuthInfo = localStorage.getItem('lit-auth-info');
      if (storedAuthInfo) {
        const parsedAuthInfo = JSON.parse(storedAuthInfo);
        setAuthInfo(parsedAuthInfo);
        console.log('Retrieved auth info:', parsedAuthInfo);

        // If we have auth info with a PKP, show the popup
        if (parsedAuthInfo.agentPKP) {
          console.log(
            'Found existing PKP in auth info, will check session validity'
          );
        }
      }
    } catch (error) {
      console.error('Error retrieving auth info:', error);
    }
  }, []);

  // Validate session once we have auth info
  useEffect(() => {
    // Skip if we've already checked the session or don't have auth info
    if (hasCheckedSession || !authInfo || !authInfo.agentPKP) return;

    const validateSession = async () => {
      try {
        // Try to get a wallet signature using the session capability object
        try {
          // Check if lit-wallet-sig exists in localStorage first
          const litWalletSig = localStorage.getItem('lit-wallet-sig');
          if (!litWalletSig) {
            console.log(
              'Storage key "lit-wallet-sig" is missing. Skipping session validation.'
            );
            setHasCheckedSession(true);
            return; // Exit early if the key is missing
          }

          console.log('Generating wallet signature...');
          // Create lit resources for action execution and PKP signing
          const litResources = [
            new LitActionResource('*'),
            new LitPKPResource('*'),
          ];

          // Generate session key
          const sessionKey = await litNodeClient.getSessionKey();

          // Generate session capability object with wildcards
          const sessionCapabilityObject =
            await litNodeClient.generateSessionCapabilityObjectWithWildcards(
              litResources
            );

          // Get wallet signature
          const walletSig = await litNodeClient.getWalletSig({
            chain: 'ethereum',
            expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
            sessionKey,
            sessionKeyUri: `lit:session:${sessionKey.publicKey}`,
            sessionCapabilityObject,
            nonce: Date.now().toString(),
          });

          if (!walletSig) {
            setHasCheckedSession(true);
            return;
          }

          if (walletSig) {
            await litNodeClient.connect();
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
            console.log('Session sigs:', attemptedSessionSigs);

            if(!attemptedSessionSigs) {
              setHasCheckedSession(true);
              return;
            }

            const validationResult = await validateSessionSigs(
              attemptedSessionSigs
            );
            console.log('Validation result:', validationResult.isValid);

            // If validation is successful, show options (change from showing popup to showing consent form)
            if (validationResult.isValid) {
              console.log(
                'Session is valid, showing popup to use existing account'
              );
              setShowPopup(true);
            }
          }
        } catch (walletSigError) {
          console.error('Error generating wallet signature:', walletSigError);
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
      setShowPopup(false);
      setShowConsentForm(true);
    } else {
      setShowPopup(false);
    }
  };

  // Handle user's choice to sign out
  const handleSignOut = async () => {
    cleanupSession();
    setShowPopup(false);
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
            <strong>Account Ethereum Address:</strong>
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
      <div className='consent-form-overlay'>
        <div className='consent-form-modal'>
          <AuthenticatedConsentForm
            userPKP={authInfo.userPKP}
            agentPKP={authInfo.agentPKP}
            sessionSigs={sessionSigs}
            isSessionValidation={false}
          />
        </div>
      </div>
    );
  }

  // If not showing consent form, render popup or nothing
  return (
    <>
      {showPopup && (
        <div className='session-popup-overlay'>
          <div className='session-popup'>
            <h3>Use Existing Account?</h3>
            <p>
              Would you like to use your existing authentication for this
              session?
            </p>

            {renderAuthMethodInfo()}

            <div className='session-popup-buttons'>
              <button
                onClick={handleUseExistingAccount}
                className='btn btn--primary'
              >
                Yes, Use Existing Account
              </button>
              <button onClick={handleSignOut} className='btn btn--outline'>
                No, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionValidator;
