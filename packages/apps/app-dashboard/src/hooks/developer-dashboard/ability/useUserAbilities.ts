import { useMemo } from 'react';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Ability } from '@/types/developer-dashboard/appTypes';

export function useUserAbilities() {
  const { authAddress: address } = useAuth();

  const {
    data: allAbilities,
    isLoading,
    isError,
    error,
    ...rest
  } = vincentApiClient.useListAllAbilitiesQuery();

  // Filter abilities by current user
  const filteredAbilities = useMemo(() => {
    if (!address || !allAbilities?.length) return [];

    return allAbilities.filter(
      (ability: Ability) => ability.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allAbilities, address]);

  const userAbilities = filteredAbilities.filter((ability: Ability) => !ability.isDeleted);
  const deletedAbilities = filteredAbilities.filter((ability: Ability) => ability.isDeleted);

  return {
    data: userAbilities,
    deletedAbilities,
    isLoading,
    isError,
    error,
    ...rest,
  };
}
