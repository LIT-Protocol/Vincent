import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

interface UrlParamsResult {
  appId: string | null;
}

export function useUserUrlAppId(): UrlParamsResult {
  const params = useParams();
  const [appId, setAppId] = useState<string | null>(null);
  useEffect(() => {
    const routeAppId = params.appId;

    if (!routeAppId) {
      setAppId(null);
      return;
    }

    setAppId(routeAppId);
  }, [params]);

  return { appId };
}
