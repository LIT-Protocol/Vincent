import { useCallback, useState } from 'react';
import { createAppUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { IRelayPKP } from '@lit-protocol/types';
import { App } from '@/types/developer-dashboard/appTypes';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { env } from '@/config/env';
import { ReadAuthInfo } from '../useAuthInfo';
import { useUrlRedirectUri } from './useUrlRedirectUri';

const { VITE_JWT_EXPIRATION_MINUTES } = env;

interface UseJwtRedirectProps {
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
}

export const useJwtRedirect = ({ readAuthInfo, agentPKP }: UseJwtRedirectProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const { redirectUri } = useUrlRedirectUri();

  // Generate JWT for redirection
  const generateJWT = useCallback(
    async (app: App, appVersion: number) => {
      if (!readAuthInfo.authInfo || !readAuthInfo.sessionSigs || !app.redirectUris) {
        setError('Cannot generate JWT: missing authentication information');
        return;
      }

      if (!redirectUri || !app.redirectUris.includes(redirectUri)) {
        setError('Cannot generate JWT: redirectUri not in authorizedRedirectUris');
        return;
      }

      setIsLoading(true);
      setError(null);
      setRedirectUrl(null);
      try {
        setLoadingStatus('Initializing Vincent Wallet');
        const agentPkpWallet = new PKPEthersWallet({
          controllerSessionSigs: readAuthInfo.sessionSigs,
          pkpPubKey: agentPKP.publicKey,
          litNodeClient: litNodeClient,
        });
        await agentPkpWallet.init();

        setLoadingStatus('Signing JWT Token');
        const jwt = await createAppUserJWT({
          pkpWallet: agentPkpWallet,
          pkpInfo: agentPKP,
          expiresInMinutes: VITE_JWT_EXPIRATION_MINUTES,
          audience: app.redirectUris,
          app: {
            id: app.appId,
            version: appVersion,
          },
          authentication: {
            type: readAuthInfo.authInfo.type,
            value: readAuthInfo.authInfo.value,
          },
        });

        const finalRedirectUrl = new URL(redirectUri);
        finalRedirectUrl.searchParams.set('jwt', jwt);
        setRedirectUrl(finalRedirectUrl.toString());
        setLoadingStatus(null);
        setIsLoading(false);
      } catch (error) {
        setError('Failed to create JWT');
        setIsLoading(false);
        return;
      }
    },
    [readAuthInfo, redirectUri],
  );

  const executeRedirect = useCallback(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  return {
    generateJWT,
    executeRedirect,
    isLoading,
    loadingStatus,
    error,
    redirectUrl,
  };
};
