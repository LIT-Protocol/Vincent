import { useCallback, useState } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { jwt } from '@lit-protocol/vincent-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { AppView } from '../types';
import { litNodeClient } from '../utils/lit';
import { useReadAuthInfo } from './useAuthInfo';

const { create } = jwt;

interface UseJwtRedirectProps {
  agentPKP?: IRelayPKP;
  sessionSigs: SessionSigs;
  redirectUri: string | null;
  onStatusChange?: (
    message: string,
    type: 'info' | 'warning' | 'success' | 'error',
  ) => void;
}

export const useJwtRedirect = ({
  agentPKP,
  sessionSigs,
  redirectUri,
  onStatusChange,
}: UseJwtRedirectProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const authInfo = useReadAuthInfo();

  // Generate JWT for redirection
  const generateJWT = useCallback(
    async (appId: string, appVersion: number, appInfo: AppView): Promise<string> => {
      if (!agentPKP || !redirectUri) {
        onStatusChange?.('Cannot generate JWT: missing agentPKP or redirectUri', 'error');
        throw new Error('Cannot generate JWT: missing agentPKP or redirectUri');
      }

      if (!authInfo) {
        onStatusChange?.('Cannot generate JWT: missing authInfo', 'error');
        throw new Error('Cannot generate JWT: missing authInfo');
      }

      if (!appInfo.authorizedRedirectUris.includes(redirectUri)) {
        onStatusChange?.('Cannot generate JWT: redirectUri not in authorizedRedirectUris', 'error');
        throw new Error('Cannot generate JWT: redirectUri not in authorizedRedirectUris');
      }

      try {
        setIsGenerating(true);
        onStatusChange?.(
          'Initializing agent PKP wallet for JWT creation...',
          'info',
        );

        const agentPkpWallet = new PKPEthersWallet({
          controllerSessionSigs: sessionSigs,
          pkpPubKey: agentPKP.publicKey,
          litNodeClient: litNodeClient,
        });
        await agentPkpWallet.init();

        onStatusChange?.('Creating signed JWT...', 'info');
        const jwt = await create({
          pkpWallet: agentPkpWallet,
          pkp: agentPKP,
          payload: {},
          expiresInMinutes: parseInt(process.env.NEXT_PUBLIC_JWT_EXPIRATION_MINUTES!),
          audience: appInfo.authorizedRedirectUris,
          app: {
            id: appId,
            version: appVersion,
          },
          authentication: {
            type: authInfo.type,
            value: authInfo.value,
          },
        });

        onStatusChange?.('JWT created successfully!', 'success');
        return jwt;
      } catch (error) {
        console.error('Error creating JWT:', error);
        onStatusChange?.('Failed to create JWT', 'error');
        throw new Error('Failed to create JWT');
      } finally {
        setIsGenerating(false);
      }
    },
    [agentPKP, authInfo, redirectUri, sessionSigs, onStatusChange],
  );

  const redirectWithJWT = useCallback(
    (jwt: string) => {
      if (!redirectUri) {
        console.error('No redirect URI available for redirect');
        return;
      }

      onStatusChange?.('Redirecting with authentication token...', 'info');
      try {
        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set('jwt', jwt);
        window.location.href = redirectUrl.toString();
      } catch (error) {
        console.error('Error creating redirect URL:', error);
      }
    },
    [redirectUri, onStatusChange],
  );

  return {
    isGenerating,
    generateJWT,
    redirectWithJWT,
  };
};
