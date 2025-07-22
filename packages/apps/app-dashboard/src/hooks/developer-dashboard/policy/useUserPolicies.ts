import { useMemo } from 'react';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Policy } from '@/types/developer-dashboard/appTypes';

export function useUserPolicies() {
  const { authInfo } = useReadAuthInfo();
  const address = authInfo?.agentPKP?.ethAddress;

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

  const userPolicies = filteredPolicies.filter((policy: Policy) => !policy.isDeleted);
  const deletedPolicies = filteredPolicies.filter((policy: Policy) => policy.isDeleted);

  return {
    data: userPolicies,
    deletedPolicies,
    isLoading,
    isError,
    error,
    ...rest,
  };
}
