import { useUserApps } from './app/useUserApps';
import { useUserAbilities } from '@/hooks/developer-dashboard/ability/useUserAbilities';
import { useUserPolicies } from './policy/useUserPolicies';
import { App, Ability, Policy } from '@/types/developer-dashboard/appTypes';

type UseDeveloperSidebarDataReturn = {
  userApps: App[];
  userAbilities: Ability[];
  userPolicies: Policy[];
  isLoading: boolean;
  error: string | null;
};

export function useDeveloperSidebarData(): UseDeveloperSidebarDataReturn {
  // Fetch base data only
  const { data: userApps, isLoading: appsLoading, error: appsError } = useUserApps();
  const {
    data: userAbilities,
    isLoading: abilitiesLoading,
    error: abilitiesError,
  } = useUserAbilities();
  const {
    data: userPolicies,
    isLoading: policiesLoading,
    error: policiesError,
  } = useUserPolicies();

  const isLoading = appsLoading || abilitiesLoading || policiesLoading;

  const appsErrorMsg = appsError ? 'Failed to load apps' : null;
  const abilitiesErrorMsg = abilitiesError ? 'Failed to load abilities' : null;
  const policiesErrorMsg = policiesError ? 'Failed to load policies' : null;
  const error = appsErrorMsg || abilitiesErrorMsg || policiesErrorMsg;

  return {
    userApps: userApps || [],
    userAbilities: userAbilities || [],
    userPolicies: userPolicies || [],
    isLoading,
    error,
  };
}
