import DashboardPage from './DashboardPage';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import { useUserTools } from '@/hooks/developer-dashboard/useUserTools';
import { useUserPolicies } from '@/hooks/developer-dashboard/useUserPolicies';
import Loading from '@/components/layout/Loading';
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
    data: tools,
    isLoading: toolsLoading,
    isError: toolsError,
    error: toolsErrorMsg,
  } = useUserTools();
  const {
    data: policies,
    isLoading: policiesLoading,
    isError: policiesError,
    error: policiesErrorMsg,
  } = useUserPolicies();

  if (appsLoading || toolsLoading || policiesLoading) return <Loading />;

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
  if (toolsError)
    return (
      <StatusMessage
        message={getErrorMessage(
          toolsErrorMsg as FetchBaseQueryError | SerializedError,
          'Failed to load tools',
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

  return <DashboardPage apps={apps || []} tools={tools || []} policies={policies || []} />;
}
