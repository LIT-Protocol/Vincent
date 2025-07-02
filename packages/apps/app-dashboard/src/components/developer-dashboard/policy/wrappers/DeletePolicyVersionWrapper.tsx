import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DeletePolicyVersionForm,
  DeletePolicyVersionFormData,
} from '../forms/DeletePolicyVersionForm';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function DeletePolicyVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetching
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  // Note: The data here is barely used, but we need to confirm the version exists with a query
  const {
    data: versionsData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName || '' });

  // Mutation
  const [deletePolicyVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeletePolicyVersionMutation();

  const [
    editPolicy,
    {
      isLoading: editPolicyLoading,
      isSuccess: editPolicySuccess,
      isError: isEditPolicyError,
      data: editPolicyData,
      error: editPolicyError,
    },
  ] = vincentApiClient.useEditPolicyMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate(`/developer/policyId/${encodeURIComponent(packageName!)}/versions`); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  useAddressCheck(policy);

  // Loading states
  if (policiesLoading || versionLoading) return <Loading />;

  // Error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load policy version" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versionsData)
    return <StatusMessage message={`Policy version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading || editPolicyLoading) {
    return <StatusMessage message="Deleting policy..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy deleted successfully!" type="success" />;
  }

  if (editPolicySuccess && editPolicyData) {
    return <StatusMessage message="Active version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete policy');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  if (isEditPolicyError && editPolicyError) {
    const errorMessage = getErrorMessage(editPolicyError, 'Failed to update active version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (formData: DeletePolicyVersionFormData) => {
    if (policy.activeVersion === version && formData.activeVersion) {
      await editPolicy({
        packageName: policy.packageName,
        policyEdit: {
          activeVersion: formData.activeVersion,
        },
      });
    }
    await deletePolicyVersion({ packageName: policy.packageName, version: version || '' });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete Policy Version</h1>
          <p className="text-gray-600 mt-2">
            Delete "{policy.title}" version {version}. This action can be undone.
          </p>
        </div>
      </div>

      <DeletePolicyVersionForm
        policy={policy}
        version={version || ''}
        versions={versionsData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
