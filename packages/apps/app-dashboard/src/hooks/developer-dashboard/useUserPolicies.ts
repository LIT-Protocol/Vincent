import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Policy } from '@/types/developer-dashboard/appTypes';

export function useUserPolicies() {
  const { address } = useAccount();

  const {
    data: allPolicies,
    isLoading,
    isError,
    error,
    refetch,
    ...rest
  } = vincentApiClient.useListAllPoliciesQuery();

  // Filter policies by current user
  const userPolicies = useMemo(() => {
    if (!address || !allPolicies?.length) return [];
    return allPolicies.filter(
      (policy: Policy) => policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address]);

  return {
    data: userPolicies,
    isLoading,
    isError,
    error,
    refetch,
    ...rest,
  };
}
