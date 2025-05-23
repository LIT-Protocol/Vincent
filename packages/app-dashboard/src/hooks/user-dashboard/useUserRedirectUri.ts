import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

interface UrlParamsResult {
  redirectUri: string | null;
}

export function useUserRedirectUri(): UrlParamsResult {
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [params] = useSearchParams();

  useEffect(() => {
    try {
      const urlRedirectUri = params.get('redirectUri');

      if (!urlRedirectUri) {
        setRedirectUri(null);
        return;
      }

      setRedirectUri(urlRedirectUri);
    } catch (error) {
      throw new Error('Error parsing redirect URI: ' + error);
    }
  }, [params]);

  return { redirectUri };
}
