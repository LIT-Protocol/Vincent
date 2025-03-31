import { useCallback, useState } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { VincentSDK } from '@lit-protocol/vincent-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { AppView } from '../types';
import { litNodeClient } from '../utils/lit';

interface UseJwtRedirectProps {
  agentPKP?: IRelayPKP;
  sessionSigs: SessionSigs;
  redirectUri: string | null;
  onStatusChange?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void;
}

export const useJwtRedirect = ({
  agentPKP,
  sessionSigs,
  redirectUri,
  onStatusChange
}: UseJwtRedirectProps) => {
  const [generatedJwt, setGeneratedJwt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate JWT for redirection
  const generateJWT = useCallback(async (appInfo: AppView): Promise<string | null> => {
    if (!agentPKP || !redirectUri) {
      console.log('Cannot generate JWT: missing agentPKP or redirectUri');
      return null;
    }

    try {
      setIsGenerating(true);
      onStatusChange?.('Initializing agent PKP wallet for JWT creation...', 'info');
      console.log('Initializing agent PKP wallet for JWT creation...');

      const agentPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: agentPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await agentPkpWallet.init();

      onStatusChange?.('Creating signed JWT...', 'info');
      console.log('Creating signed JWT...');
      const vincent = new VincentSDK();
      const jwt = await vincent.createSignedJWT({
        pkpWallet: agentPkpWallet,
        pkp: agentPKP,
        payload: {},
        expiresInMinutes: 2160,
        audience: appInfo.authorizedRedirectUris,
      });

      if (jwt) {
        console.log('JWT created successfully:', jwt);
        setGeneratedJwt(jwt);
        onStatusChange?.('JWT created successfully!', 'success');
        return jwt;
      }
    } catch (error) {
      console.error('Error creating JWT:', error);
      onStatusChange?.('Failed to create JWT', 'error');
    } finally {
      setIsGenerating(false);
    }

    return null;
  }, [agentPKP, redirectUri, sessionSigs, onStatusChange]);

  const redirectWithJWT = useCallback(async (jwt: string | null) => {
    if (!redirectUri) {
      console.error('No redirect URI available for redirect');
      return;
    }

    const jwtToUse = jwt || generatedJwt;

    if (jwtToUse) {
      onStatusChange?.('Redirecting with authentication token...', 'info');
      console.log('Redirecting with JWT:', jwtToUse);
      try {
        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set('jwt', jwtToUse);

        const finalUrl = redirectUrl.toString();

        window.location.href = finalUrl;
      } catch (error) {
        console.error('Error creating redirect URL:', error);
        window.location.href = redirectUri;
      }
    } else {
      onStatusChange?.('Redirecting without authentication token...', 'info');
      console.log('No JWT available, redirecting without JWT');
      let fallbackRedirectUri = redirectUri;
      window.location.href = fallbackRedirectUri;
    }
  }, [redirectUri, generatedJwt, onStatusChange]);

  return {
    generatedJwt,
    isGenerating,
    generateJWT,
    redirectWithJWT
  };
};
