import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeletePolicyForm } from '../forms/DeletePolicyForm';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';

export function DeletePolicyWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: policy,
    isLoading: policyLoading,
    isError: policyError,
  } = vincentApiClient.useGetPolicyQuery({ packageName: packageName || '' });

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

  // Loading states
  if (policyLoading) return <Loading />;

  // Error states
  if (policyError) return <StatusMessage message="Failed to load policy" type="error" />;
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
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Delete Policy</h1>
            <p className="text-gray-600 mt-2">Delete "{policy.title}" and all its data.</p>
          </div>
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
