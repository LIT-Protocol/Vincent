import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeletePolicyForm } from '../forms/DeletePolicyForm';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';

export function DeletePolicyWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  // Mutation
  const [deletePolicy, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeletePolicyMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate('/developer/policies'); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  useAddressCheck(policy);

  // Loading states
  if (policiesLoading) return <Loading />;

  // Error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Deleting policy..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete policy');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deletePolicy({ packageName: policy.packageName });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete Policy</h1>
          <p className="text-gray-600 mt-2">
            Permanently delete "{policy.title}" and all its data. This action cannot be undone.
          </p>
        </div>
      </div>

      <DeletePolicyForm
        title={policy.title || ''}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
