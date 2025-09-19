import { useGetPermittedAgentAppsQuery } from '@/store/agentPkpsApi';

export function useAllAgentApps(userAddress: string | undefined) {
  const {
    data: permittedPKPs = [],
    isLoading: loading,
    error: queryError,
  } = useGetPermittedAgentAppsQuery(userAddress || '', {
    skip: !userAddress,
  });

  // Convert RTK Query error to Error object for compatibility
  const error = queryError
    ? new Error(
        typeof queryError === 'object' && 'error' in queryError
          ? String(queryError.error)
          : 'Failed to fetch agent apps',
      )
    : null;

  return { permittedPKPs, loading, error };
}
