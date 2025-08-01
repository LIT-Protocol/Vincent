import DashboardPage from './DashboardPage';
import { useUserApps } from '@/hooks/developer-dashboard/app/useUserApps';
import { useUserAbilities } from '@/hooks/developer-dashboard/ability/useUserAbilities';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

export default function DashboardRoute() {
  const {
    data: apps,
    isLoading: appsLoading,
    isError: appsError,
    error: appsErrorMsg,
  } = useUserApps();
  const {
    data: abilities,
    isLoading: abilitiesLoading,
    isError: abilitiesError,
    error: abilitiesErrorMsg,
  } = useUserAbilities();
  const {
    data: policies,
    isLoading: policiesLoading,
    isError: policiesError,
    error: policiesErrorMsg,
  } = useUserPolicies();

  if (appsLoading || abilitiesLoading || policiesLoading) return <Loading />;

  if (appsError)
    return (
      <StatusMessage
        message={getErrorMessage(
          appsErrorMsg as FetchBaseQueryError | SerializedError,
          'Failed to load apps',
        )}
        type="error"
      />
    );
  if (abilitiesError)
    return (
      <StatusMessage
        message={getErrorMessage(
          abilitiesErrorMsg as FetchBaseQueryError | SerializedError,
          'Failed to load abilities',
        )}
        type="error"
      />
    );
  if (policiesError)
    return (
      <StatusMessage
        message={getErrorMessage(
          policiesErrorMsg as FetchBaseQueryError | SerializedError,
          'Failed to load policies',
        )}
        type="error"
      />
    );

  return <DashboardPage apps={apps || []} abilities={abilities || []} policies={policies || []} />;
}
