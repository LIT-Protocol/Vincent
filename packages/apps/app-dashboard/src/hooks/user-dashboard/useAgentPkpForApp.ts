import { useMemo } from 'react';
import { useGetAgentPkpsQuery } from '@/store/agentPkpsApi';
import { env } from '@/config/env';

export function useAgentPkpForApp(userAddress: string | undefined, appId: number | undefined) {
  const {
    data: agentPkpsData,
    isLoading: loading,
    error: queryError,
  } = useGetAgentPkpsQuery(userAddress || '', {
    skip: !userAddress || appId === undefined,
  });

  // Convert RTK Query error to Error object for compatibility
  const error = queryError
    ? new Error(
        typeof queryError === 'object' && 'error' in queryError
          ? String(queryError.error)
          : 'Failed to fetch agent PKPs',
      )
    : null;

  const result = useMemo(() => {
    if (!agentPkpsData || appId === undefined) {
      return {
        agentPKP: null,
        permittedVersion: null,
        versionEnabled: null,
      };
    }

    const { permitted, unpermitted } = agentPkpsData;

    // Check if this is Vincent Yield and we have unpermitted fallback
    if (appId === Number(env.VITE_VINCENT_YIELD_APPID)) {
      // hadUnpermittedFallback is true when there's only one PKP with appId = -1
      const hadUnpermittedFallback = permitted.length === 1 && permitted[0].appId === -1;
      if (hadUnpermittedFallback) {
        return {
          agentPKP: permitted[0].pkp,
          permittedVersion: null,
          versionEnabled: null,
        };
      }
    }

    // Find the permission entry for this specific app in permitted list
    const appPermission = permitted.find((p) => p.appId === appId);

    if (appPermission) {
      return {
        agentPKP: appPermission.pkp,
        permittedVersion: appPermission.permittedVersion,
        versionEnabled: null, // For permitted apps, versionEnabled is not relevant
      };
    } else {
      // Check if this app was previously permitted and return that PKP for reuse
      const previousPermission = unpermitted.find((p) => p.appId === appId);
      if (previousPermission) {
        // Return the PKP that was previously permitted so ConnectPage can reuse it
        return {
          agentPKP: previousPermission.pkp,
          permittedVersion: null,
          versionEnabled: previousPermission.versionEnabled ?? null,
        };
      } else {
        return {
          agentPKP: null,
          permittedVersion: null,
          versionEnabled: null,
        };
      }
    }
  }, [agentPkpsData, appId]);

  return {
    ...result,
    loading,
    error,
  };
}
