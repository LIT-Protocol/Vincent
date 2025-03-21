import { useState, useEffect, useCallback } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { VincentSDK } from '@lit-protocol/vincent-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

import { useUrlAppId } from '../hooks/useUrlAppId';
import { litNodeClient } from '../utils/lit';
import * as ethers from 'ethers';
import {
  getAppRegistryContract,
  getUserViewRegistryContract,
  getUserRegistryContract,
} from '../utils/contracts';

interface AuthenticatedConsentFormProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
  isSessionValidation?: boolean;
}

interface AppView {
  name: string;
  description: string;
  manager: string;
  latestVersion: ethers.BigNumber | number;
  delegatees: string[] | any[];
  authorizedRedirectUris: string[];
}

export default function AuthenticatedConsentForm ({
  sessionSigs,
  agentPKP,
  isSessionValidation,
  userPKP,
}: AuthenticatedConsentFormProps) {
  const { appId, error: urlError } = useUrlAppId();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showDisapproval, setShowDisapproval] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appInfo, setAppInfo] = useState<AppView | null>(null);
  const [referrerUrl, setReferrerUrl] = useState<string | null>(null);
  const [generatedJwt, setGeneratedJwt] = useState<string | null>(null);
  const [isAppAlreadyPermitted, setIsAppAlreadyPermitted] =
    useState<boolean>(false);
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true);
  const [showingAuthorizedMessage, setShowingAuthorizedMessage] = useState<boolean>(false);
  const [isUriUntrusted, setIsUriUntrusted] = useState<boolean>(false);
  const [authorizedDomains, setAuthorizedDomains] = useState<string[]>([]);
  // ===== JWT and Redirect Functions =====
  
  // Generate JWT for redirection
  const generateJWT = useCallback(async (appInfo: AppView): Promise<string | null> => {
    if (!agentPKP || !referrerUrl) {
      console.log('Cannot generate JWT: missing agentPKP or referrerUrl');
      return null;
    }

    try {
      console.log('Initializing agent PKP wallet for JWT creation...');
      const agentPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: agentPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await agentPkpWallet.init();

      const vincent = new VincentSDK();
      const jwt = await vincent.createSignedJWT({
        pkpWallet: agentPkpWallet as any,
        pkp: agentPKP,
        payload: {},
        expiresInMinutes: 30,
        audience: appInfo.authorizedRedirectUris,
      });

      if (jwt) {
        console.log('JWT created successfully:', jwt);
        // Store the JWT in state for reuse if needed
        setGeneratedJwt(jwt);
        return jwt;
      }
    } catch (error) {
      console.error('Error creating JWT:', error);
    }

    return null;
  }, [agentPKP, referrerUrl, sessionSigs]);

  // Redirect with JWT
  const redirectWithJWT = useCallback(async (jwt: string | null) => {
    if (!referrerUrl) {
      console.error('No referrer URL available for redirect');
      return;
    }

    // Use the provided JWT or the one stored in state
    const jwtToUse = jwt || generatedJwt;

    if (jwtToUse) {
      console.log('Redirecting with JWT:', jwtToUse);
      try {
        const redirectUrl = new URL(referrerUrl);
        redirectUrl.searchParams.set('jwt', jwtToUse);
        window.location.href = redirectUrl.toString();
      } catch (error) {
        console.error('Error creating redirect URL:', error);
        window.location.href = referrerUrl;
      }
    } else {
      console.log('No JWT available, redirecting without JWT');
      window.location.href = referrerUrl;
    }
  }, [referrerUrl, generatedJwt]);

  // ===== Consent Approval Functions =====
  
  // Approve consent on the blockchain
  const approveConsent = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for consent approval');
      throw new Error('Missing required data for consent approval');
    }

    const userRegistryContract = getUserRegistryContract();
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();
    userRegistryContract.connect(userPkpWallet);

    // Connect the wallet to the contract and assign it back to a variable
    const connectedContract = userRegistryContract.connect(userPkpWallet);
    
    // Use the connected contract to send the transaction
    const txResponse = await connectedContract.permitAppVersion(
      agentPKP.tokenId,
      appId,
      Number(appInfo.latestVersion),
      [],
      [[]],
      [[[]]],
      [[[]]],
      {
        gasLimit: 1000000,
      }
    );

    const receipt = await txResponse.wait();
    console.log('Transaction receipt:', receipt);

    return receipt;
  }, [agentPKP, appId, appInfo, sessionSigs, userPKP]);

  // ===== Event Handler Functions =====
  
  const handleApprove = useCallback(async () => {
    if (!appInfo) {
      console.error('Missing version data in handleApprove');
      setError('Missing version data. Please refresh the page and try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      // Form submission logic
      const handleFormSubmission = async (): Promise<{ success: boolean }> => {
        try {
          // First check if we have all required data
          if (!appInfo) {
            console.error(
              'Missing version data or tool IPFS CID hashes in handleFormSubmission'
            );
            setError('Missing version data. Please try again.');
            return { success: false };
          }

          if (!agentPKP || !appId || !appInfo) {
            console.error(
              'Missing required data for consent approval in handleFormSubmission'
            );
            setError('Missing required data. Please try again.');
            return { success: false };
          }

          // First approve the consent
          await approveConsent();

          // Then generate JWT after successful consent approval
          const jwt = await generateJWT(appInfo);

          // Show success animation
          setShowSuccess(true);

          // Wait for the animation to play before redirecting
          setTimeout(() => {
            redirectWithJWT(jwt);
          }, 2000); // Animation display time

          return {
            success: true,
          };
        } catch (error) {
          console.error('Error processing transaction:', {
            error,
            errorCode: (error as any).code,
            errorMessage: (error as any).message,
            errorReason: (error as any).reason,
            errorData: (error as any).data,
          });
          setError('An error occurred while processing your request');
          throw error;
        }
      };

      await handleFormSubmission();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  }, [approveConsent, generateJWT, redirectWithJWT, agentPKP, appId, appInfo]);

  const handleDisapprove = useCallback(async () => {
    setShowDisapproval(true);

    // Wait for animation to complete before redirecting
    setTimeout(() => {
      // Then wait a moment before redirecting
      setTimeout(() => {
        // Redirect to the referrer URL without the JWT
        if (referrerUrl) {
          window.location.href = referrerUrl;
        }
      }, 100); // Small delay to ensure callback completes
    }, 2000); // Animation display time
  }, [referrerUrl]);

  // ===== Data Loading Effects =====
  
  // Load referrer URL from session storage
  useEffect(() => {
    const storedReferrerUrl = sessionStorage.getItem('referrerUrl');
    if (storedReferrerUrl) {
      setReferrerUrl(storedReferrerUrl);
    }
  }, []);

  // Check if app is already permitted for this PKP and fetch all app data
  useEffect(() => {
    async function checkAppPermissionAndFetchData () {
      if (!appId || !agentPKP) {
        setCheckingPermissions(false);
        return;
      }

    async function verifyUri (appInfo: AppView) {
      if (!referrerUrl) {
        return false;
      }
      
      try {
        // Extract domain and port from referrer URL
        const referrerUrl_obj = new URL(referrerUrl);
        const referrerDomain = referrerUrl_obj.hostname;
        const referrerPort = referrerUrl_obj.port || (referrerUrl_obj.protocol === 'https:' ? '443' : '80');
        
        // Get domains and ports from authorized URIs
        const authorizedDomainsWithPorts = appInfo?.authorizedRedirectUris?.map(uri => {
          try {
            const url = new URL(uri);
            const domain = url.hostname;
            const port = url.port || (url.protocol === 'https:' ? '443' : '80');
            return { domain, port, fullDomain: domain + (port === '80' || port === '443' ? '' : ':' + port) };
          } catch (e) {
            console.error(`Invalid URI in authorizedRedirectUris: ${uri}`, e);
            return null;
          }
        }).filter(item => item !== null) || [];
        
        console.log('Authorized domains with ports:', authorizedDomainsWithPorts);
        
        // Store just the display domains for UI display
        const displayDomains = authorizedDomainsWithPorts.map(item => item?.fullDomain || '');
        const uniqueDomains = [...new Set(displayDomains)];
        setAuthorizedDomains(uniqueDomains);
        
        // Check if referrer domain and port are in the list of authorized domains and ports
        return authorizedDomainsWithPorts.some(item => 
          item?.domain === referrerDomain && item?.port === referrerPort
        );
      } catch (e) {
        console.error('Error parsing referrer URL:', e);
        return false;
      }
    }

      try {
        // Get all permitted app IDs for this PKP
        const userViewRegistryContract = getUserViewRegistryContract();
        const permittedAppIds =
          await userViewRegistryContract.getAllPermittedAppIdsForPkp(
            agentPKP.tokenId
          );

        // Fetch app info directly without conversion
        let appRawInfo;
        // Use callStatic to avoid state changes and get raw data
        const appRegistryContract = getAppRegistryContract();
        appRawInfo = await appRegistryContract.getAppById(Number(appId));

        setAppInfo(appRawInfo);

        const isUriVerified = await verifyUri(appRawInfo);
        
        if (!isUriVerified) {
          setIsUriUntrusted(true);
          setCheckingPermissions(false);
          setIsLoading(false);
          return;
        }

        // Check if the current app ID is in the permitted list
        const appIdNum = Number(appId);
        const isPermitted = permittedAppIds.some(
          (id: ethers.BigNumber) => id.toNumber() === appIdNum
        );

        console.log('Is app already permitted?', isPermitted);
        setIsAppAlreadyPermitted(isPermitted);

        // If app is already permitted, generate JWT and redirect immediately
        if (isPermitted && referrerUrl) {
          console.log(
            'App is already permitted. Generating JWT and redirecting...'
          );
          // First show only "already authorized" message
          setShowingAuthorizedMessage(true);
          const jwt = await generateJWT(appRawInfo);
          
          // Delay showing the success animation
          setTimeout(() => {
            setShowSuccess(true);
            
            // After animation is shown, wait before redirecting
            setTimeout(() => {
              redirectWithJWT(jwt);
            }, 1000);
          }, 2000); // Show message for 2 seconds before animation
        }
      } catch (err) {
        console.error(
          'Error checking app permissions or fetching app data:',
          err
        );
      } finally {
        setCheckingPermissions(false);
        // Always set isLoading to false when permissions check completes
        setIsLoading(false);
      }
    }

    checkAppPermissionAndFetchData();
  }, [appId, agentPKP, referrerUrl]);

  // Fetch app info from database
  useEffect(() => {
    let mounted = true;

    async function fetchAppInfo () {
      // Don't do anything if appId is missing, component is unmounted, or app is already permitted
      if (!appId || !mounted || isAppAlreadyPermitted) return;

      // Don't proceed if we're still checking permissions in the other effect
      if (checkingPermissions) return;

      try {
        if (appInfo && mounted) {
          console.log('App info retrieved');

          // Only set loading to false when we have appInfo
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchAppInfo:', err);
        if (mounted) {
          setError('Failed to load app information');
          setIsLoading(false);
        }
      }
    }

    fetchAppInfo();

    return () => {
      mounted = false;
    };
  }, [appId, agentPKP, isAppAlreadyPermitted, appInfo, checkingPermissions]);

  // ===== Render Logic =====
  
  // If URL is untrusted, show an error message
  if (isUriUntrusted) {
    return (
      <div className="consent-form-container">
        <h1>Untrusted URI</h1>
        
        <div className="alert alert--error" style={{display: "block"}}>
          <p style={{display: "block"}}>This application is trying to redirect to a URI that is not on its list of authorized redirect URIs. For your security, this request has been blocked.</p>
          {referrerUrl && (
            <div style={{display: "block", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)"}}>
              <div style={{display: "block"}}>
                <strong>Untrusted URI:</strong>
              </div>
              <div style={{display: "block", marginTop: "8px", paddingLeft: "0"}}>
                <span style={{whiteSpace: "normal", wordBreak: "break-all", fontFamily: "monospace"}}>{referrerUrl}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="details-card" style={{flexDirection: "column", backgroundColor: "#f5f5f5", border: "1px solid #e5e7eb"}}>
          <h4 style={{marginTop: 0, marginBottom: "0.5rem", fontSize: "1rem"}}>Authorized Redirect URIs:</h4>
          {appInfo && appInfo.authorizedRedirectUris && appInfo.authorizedRedirectUris.length > 0 ? (
            <ul className="permissions-list" style={{marginTop: "0.5rem"}}>
              {authorizedDomains.map((domain, index) => (
                <li key={index} style={{backgroundColor: "#ffffff", fontSize: "0.875rem"}}>{domain}</li>
              ))}
            </ul>
          ) : (
            <p style={{fontSize: "0.875rem"}}>No authorized redirect URIs have been configured for this application.</p>
          )}
        </div>
      </div>
    );
  }
  
  // If the app is already permitted, show a brief loading spinner or success animation
  if (isAppAlreadyPermitted || (showSuccess && checkingPermissions) || showingAuthorizedMessage) {
    return (
      <div className='container'>
        <div className='consent-form-container'>
          {showSuccess && (
            <div className='animation-overlay'>
              <svg className='success-checkmark' viewBox='0 0 52 52'>
                <circle
                  className='success-checkmark__circle'
                  cx='26'
                  cy='26'
                  r='25'
                  fill='none'
                />
                <path
                  className='success-checkmark__check'
                  fill='none'
                  d='M14.1 27.2l7.1 7.2 16.7-16.8'
                />
              </svg>
            </div>
          )}
          <p className='auto-redirect-message'>
            This app is already authorized. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // Show loading indicator while checking permissions or loading app info
  if (checkingPermissions || isLoading) {
    return (
      <div className='consent-form-container'>
        <p>Loading app information...</p>
      </div>
    );
  }

  // Show error message if there's no appId or if there's an error
  if (!appId) {
    return (
      <div className='consent-form-container'>
        <div className='alert alert--error'>
          <p>Missing appId parameter</p>
        </div>
      </div>
    );
  }

  if (urlError) {
    return (
      <div className='consent-form-container'>
        <div className='alert alert--error'>
          <p>{urlError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isSessionValidation ? 'session-validator-consent' : 'container'
      }
    >
      <div className='consent-form-container'>
        {showSuccess && (
          <div className='animation-overlay'>
            <svg className='success-checkmark' viewBox='0 0 52 52'>
              <circle
                className='success-checkmark__circle'
                cx='26'
                cy='26'
                r='25'
                fill='none'
              />
              <path
                className='success-checkmark__check'
                fill='none'
                d='M14.1 27.2l7.1 7.2 16.7-16.8'
              />
            </svg>
          </div>
        )}

        {showDisapproval && (
          <div className='animation-overlay'>
            <svg className='error-x' viewBox='0 0 52 52'>
              <circle
                className='error-x__circle'
                cx='26'
                cy='26'
                r='25'
                fill='none'
              />
              <line
                className='error-x__line error-x__line--first'
                x1='16'
                y1='16'
                x2='36'
                y2='36'
              />
              <line
                className='error-x__line error-x__line--second'
                x1='36'
                y1='16'
                x2='16'
                y2='36'
              />
            </svg>
          </div>
        )}

        <h1>Agent Consent Notice</h1>
        {error && (
          <div className='alert alert--error'>
            <p>{error}</p>
          </div>
        )}

        {appInfo && (
          <div className='app-info'>
            <h2>App Information</h2>
            <div className='app-info-details'>
              <p>
                <strong>Name:</strong> {appInfo.name}
              </p>
              <p>
                <strong>Description:</strong> {appInfo.description}
              </p>
              {agentPKP && (
                <p>
                  <strong>PKP Address:</strong> {agentPKP.ethAddress}
                </p>
              )}
              {appInfo && (
                <>
                  <p>
                    <strong>Version:</strong>{' '}
                    {appInfo.latestVersion ? appInfo.latestVersion.toString() : '1'}
                  </p>
                </>
              )}
            </div>

            <div className='consent-actions'>
              <button
                className='btn btn--primary'
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Approve'}
              </button>
              <button
                className='btn btn--outline'
                onClick={handleDisapprove}
                disabled={submitting}
              >
                Disapprove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
