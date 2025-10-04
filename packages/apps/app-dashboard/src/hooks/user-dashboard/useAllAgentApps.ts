import {
  useGetPermittedAgentAppsQuery,
  useGetUnpermittedAgentAppsQuery,
} from '@/store/agentPkpsApi';

export function useAllAgentApps(userAddress: string | undefined) {
  const {
    data: permittedPkps = [],
    isLoading: permittedLoading,
    error: permittedError,
  } = useGetPermittedAgentAppsQuery(userAddress || '', {
    skip: !userAddress,
  });

  const {
    data: unpermittedPkps = [],
    isLoading: unpermittedLoading,
    error: unpermittedError,
  } = useGetUnpermittedAgentAppsQuery(userAddress || '', {
    skip: !userAddress,
  });

  const loading = permittedLoading || unpermittedLoading;
  const queryError = permittedError || unpermittedError;

  // Convert RTK Query error to Error object for compatibility
  const error = queryError
    ? new Error(
        typeof queryError === 'object' && 'error' in queryError
          ? String(queryError.error)
          : 'Failed to fetch agent apps',
      )
    : null;

  return { permittedPkps, unpermittedPkps, loading, error };
}
