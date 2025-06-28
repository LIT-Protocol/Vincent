import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Tool } from '@/types/developer-dashboard/appTypes';

export function useUserTools() {
  const { address } = useAccount();

  const {
    data: allTools,
    isLoading,
    isError,
    error,
    refetch,
    ...rest
  } = vincentApiClient.useListAllToolsQuery();

  // Filter tools by current user
  const userTools = useMemo(() => {
    if (!address || !allTools?.length) return [];
    return allTools.filter(
      (tool: Tool) => tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address]);

  return {
    data: userTools,
    isLoading,
    isError,
    error,
    refetch,
    ...rest,
  };
}
