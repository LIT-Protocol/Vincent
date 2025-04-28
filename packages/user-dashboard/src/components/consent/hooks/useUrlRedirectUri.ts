import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

interface UrlParamsResult {
  redirectUri: string | null;
  error: string | null;
}

export function useUrlRedirectUri(): UrlParamsResult {
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params] = useSearchParams();

  useEffect(() => {
    const urlRedirectUri = params.get('redirectUri');

    if (!urlRedirectUri) {
      setError('No redirectUri provided');
      setRedirectUri(null);
      return;
    }

    setRedirectUri(urlRedirectUri);
    setError(null);
  }, [params]);

  return { redirectUri, error };
}
