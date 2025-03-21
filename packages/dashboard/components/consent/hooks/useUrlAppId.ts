import { useState, useEffect } from 'react';

interface UrlParamsResult {
  appId: string | null;
  version: string | null;
  jwt: string | null;
  error: string | null;
}

export function useUrlAppId(): UrlParamsResult {
  const [appId, setAppId] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    const urlAppId = params.get('appId');
    const urlVersion = params.get('version');
    const urlJwt = params.get('jwt');

    // Extract JWT if present
    setJwt(urlJwt);

    if (!urlAppId) {
      setError('No appId provided');
      setAppId(null);
      return;
    }

    // Set the parsed appId 
    setAppId(urlAppId);
    
    if (!urlVersion) {
      // Default to version "0" if not provided
      setVersion("0");
    } else {
      setVersion(urlVersion);
    }

    // Clear any previous errors
    setError(null);
  }, []);

  return { appId, version, jwt, error };
} 