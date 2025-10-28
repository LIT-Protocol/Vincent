import { useNavigate } from 'react-router-dom';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyListView } from '../views/PolicyListView';

export function PoliciesWrapper() {
  const navigate = useNavigate();

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

  const handleNavigateToCreate = () => {
    navigate('/developer/policies/create-policy');
  };

  return (
    <>
      <PolicyListView
        policies={policies}
        deletedPolicies={deletedPolicies}
        onCreatePolicy={handleNavigateToCreate}
      />
    </>
  );
}
