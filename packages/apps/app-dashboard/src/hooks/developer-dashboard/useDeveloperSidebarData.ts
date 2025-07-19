import { useUserApps } from './app/useUserApps';
import { useUserTools } from './tool/useUserTools';
import { useUserPolicies } from './policy/useUserPolicies';
import { App, Tool, Policy } from '@/types/developer-dashboard/appTypes';

type UseDeveloperSidebarDataReturn = {
  userApps: App[];
  userTools: Tool[];
  userPolicies: Policy[];
  isLoading: boolean;
  error: string | null;
};

export function useDeveloperSidebarData(): UseDeveloperSidebarDataReturn {
  // Fetch base data only
  const { data: userApps, isLoading: appsLoading, error: appsError } = useUserApps();
  const { data: userTools, isLoading: toolsLoading, error: toolsError } = useUserTools();
  const {
    data: userPolicies,
    isLoading: policiesLoading,
    error: policiesError,
  } = useUserPolicies();

  const isLoading = appsLoading || toolsLoading || policiesLoading;

  const appsErrorMsg = appsError ? 'Failed to load apps' : null;
  const toolsErrorMsg = toolsError ? 'Failed to load tools' : null;
  const policiesErrorMsg = policiesError ? 'Failed to load policies' : null;
  const error = appsErrorMsg || toolsErrorMsg || policiesErrorMsg;

  return {
    userApps: userApps || [],
    userTools: userTools || [],
    userPolicies: userPolicies || [],
    isLoading,
    error,
  };
}
