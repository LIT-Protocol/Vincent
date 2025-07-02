import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  CreatePolicyVersionForm,
  type CreatePolicyVersionFormData,
} from '../forms/CreatePolicyVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';

export function CreatePolicyVersionWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  const { isLoading: versionsLoading, isError: versionsError } =
    vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName || '' });

  // Mutation
  const [createPolicyVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useCreatePolicyVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && policy) {
      navigateWithDelay(
        navigate,
        `/developer/policyId/${encodeURIComponent(policy.packageName)}/version/${data.version}`,
      );
    }
  }, [isSuccess, data, navigate, policy]);

  useAddressCheck(policy);

  // Loading states
  if (policiesLoading || versionsLoading) return <Loading />;

  // Error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load policy versions" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Creating policy version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy version created successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create policy version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreatePolicyVersionFormData) => {
    await createPolicyVersion({
      packageName: policy.packageName,
      version: data.version,
      policyVersionCreate: {
        changes: data.changes,
      },
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Create New Version</h1>
          <p className="text-gray-600 mt-2">
            Create a new version of your policy with updated features
          </p>
        </div>
      </div>

      <CreatePolicyVersionForm policy={policy} onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
