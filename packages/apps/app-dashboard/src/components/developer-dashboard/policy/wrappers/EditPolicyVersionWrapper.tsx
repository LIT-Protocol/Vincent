import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  EditPolicyVersionForm,
  type EditPolicyVersionFormData,
} from '../forms/EditPolicyVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function EditPolicyVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetching
  const {
    data: policy,
    isLoading: policyLoading,
    isError: policyError,
  } = vincentApiClient.useGetPolicyQuery({ packageName: packageName || '' });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetPolicyVersionQuery({
    packageName: packageName || '',
    version: version || '',
  });

  // Mutation
  const [editPolicyVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditPolicyVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && policy && versionData) {
      navigateWithDelay(
        navigate,
        `/developer/policyId/${encodeURIComponent(policy.packageName)}/version/${versionData.version}`,
      );
    }
  }, [isSuccess, data, navigate, policy, versionData]);

  // Loading states
  if (policyLoading || versionLoading) return <Loading />;

  // Error states
  if (policyError) return <StatusMessage message="Failed to load policy" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versionData) return <StatusMessage message={`Version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating policy version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update policy version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditPolicyVersionFormData) => {
    await editPolicyVersion({
      packageName: policy.packageName,
      version: versionData.version,
      policyVersionEdit: data,
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit {policy.packageName} - Version {versionData.version}
          </h1>
          <p className="text-gray-600 mt-2">
            Update the settings and configuration for this version
          </p>
        </div>
      </div>

      <EditPolicyVersionForm
        versionData={versionData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
