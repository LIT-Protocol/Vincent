import { useMemo } from 'react';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Policy } from '@/types/developer-dashboard/appTypes';

export function useUserPolicies() {
  const { authInfo } = useReadAuthInfo();
  const address = authInfo?.userPKP?.ethAddress;

  const {
    data: allPolicies,
    isLoading,
    isError,
    error,
    ...rest
  } = vincentApiClient.useListAllPoliciesQuery();

  // Filter policies by current user
  const filteredPolicies = useMemo(() => {
    if (!address || !allPolicies?.length) return [];

    return allPolicies.filter(
      (policy: Policy) => policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address]);

  return {
    data: filteredPolicies,
    isLoading,
    isError,
    error,
    ...rest,
  };
}
