import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { getAgentPkps } from '../../utils/user-dashboard/getAgentPkps';
import { env } from '@/config/env';

export function useAgentPkpForApp(userAddress: string | undefined, appId: number | undefined) {
  const [agentPKP, setAgentPKP] = useState<IRelayPKP | null>(null);
  const [permittedVersion, setPermittedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || appId === undefined) {
      setAgentPKP(null);
      setPermittedVersion(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAgentPKP = async () => {
      try {
        const agentPKPs = await getAgentPkps(userAddress);

        // Check if this is Vincent Yield and we have unpermitted fallback
        if (appId === Number(env.VITE_VINCENT_YIELD_APPID)) {
          // hadUnpermittedFallback is true when there's only one PKP with appId = -1
          const hadUnpermittedFallback = agentPKPs.length === 1 && agentPKPs[0].appId === -1;
          if (hadUnpermittedFallback) {
            setAgentPKP(agentPKPs[0].pkp);
            setPermittedVersion(null);
            setLoading(false);
            return;
          }
        }

        // Find the permission entry for this specific app
        const appPermission = agentPKPs.find((p) => p.appId === appId);

        if (appPermission) {
          setAgentPKP(appPermission.pkp);
          setPermittedVersion(appPermission.permittedVersion);
        } else {
          setAgentPKP(null);
          setPermittedVersion(null);
        }
      } catch (err) {
        setError(err as Error);
        setAgentPKP(null);
        setPermittedVersion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentPKP();
  }, [userAddress, appId]);

  return { agentPKP, permittedVersion, loading, error };
}
