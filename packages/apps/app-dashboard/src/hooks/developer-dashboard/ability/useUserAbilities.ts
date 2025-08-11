import { useMemo } from 'react';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Ability } from '@/types/developer-dashboard/appTypes';

export function useUserAbilities() {
  const { authInfo } = useReadAuthInfo();
  const address = authInfo?.userPKP?.ethAddress;

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
