import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

type useUriPrecheckParams = {
  authorizedRedirectUris: string[] | undefined;
};

interface UrlParamsResult {
  result: boolean | null;
  error?: string | null;
  redirectUri?: string | null;
}

export function useUriPrecheck({ authorizedRedirectUris }: useUriPrecheckParams): UrlParamsResult {
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [params] = useSearchParams();

  useEffect(() => {
    if (!authorizedRedirectUris || authorizedRedirectUris.length === 0) {
      setError('No authorized redirect URIs configured');
      setResult(false);
      setRedirectUri(null);
      return;
    }

    const urlRedirectUri = params.get('redirectUri');

    if (!urlRedirectUri) {
      setError('No redirectUri provided');
      setResult(false);
      setRedirectUri(null);
      return;
    }

    setRedirectUri(urlRedirectUri);

    // Check if the redirect URI is in the authorized list
    const isAuthorized = authorizedRedirectUris.includes(urlRedirectUri);

    if (isAuthorized) {
      setResult(true);
      setError(null);
    } else {
      setResult(false);
      setError('Redirect URI is not authorized');
    }
  }, [params, authorizedRedirectUris]);

  return { result, error, redirectUri };
}
