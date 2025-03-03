import { useState, useEffect } from 'react';

interface UrlAppIdResult {
  appId: string | null;
  error: string | null;
}

export function useUrlAppId(): UrlAppIdResult {
  const [appId, setAppId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAppId = params.get('appId');
    
    if (!urlAppId) {
      setError('No AppId provided');
      setAppId(null);
      return;
    }

    if (urlAppId !== '123' && urlAppId !== '456') {
      setError('Invalid AppId');
      setAppId(null);
      return;
    }

    setError(null);
    setAppId(urlAppId);
  }, []);

  return { appId, error };
} 