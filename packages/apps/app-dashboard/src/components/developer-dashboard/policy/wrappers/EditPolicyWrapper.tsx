import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditPolicyForm, type EditPolicyFormData } from '../forms/EditPolicyForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';

export function EditPolicyWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  const {
    data: policyVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName || '' });

  // Mutation
  const [editPolicy, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditPolicyMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && policy) {
      navigateWithDelay(navigate, `/developer/policyId/${encodeURIComponent(policy.packageName)}`);
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
    return <StatusMessage message="Updating policy..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update policy');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditPolicyFormData) => {
    const { packageName, ...policyEditData } = data;

    await editPolicy({
      packageName,
      policyEdit: { ...policyEditData },
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit {policy.packageName}</h1>
          <p className="text-gray-600 mt-2">Update your policy settings and configuration</p>
        </div>
      </div>

      <EditPolicyForm
        policyData={policy}
        policyVersions={policyVersions || []}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
