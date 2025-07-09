import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyListView } from '../views/PolicyListView';

export function PoliciesWrapper() {
  const {
    data: policies,
    deletedPolicies,
    isLoading: policiesLoading,
    isError: policiesError,
  } = useUserPolicies();

  // Loading states first
  if (policiesLoading) return <Loading />;

  // Combined error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;

  return <PolicyListView policies={policies} deletedPolicies={deletedPolicies} />;
}
