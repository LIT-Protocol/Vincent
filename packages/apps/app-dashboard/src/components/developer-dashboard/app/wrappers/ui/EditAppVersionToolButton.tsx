import { useEffect } from 'react';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  EditAppVersionToolForm,
  type EditAppVersionToolFormData,
} from '../../forms/EditAppVersionToolForm';
import { AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { sortedSupportedPolicies } from '@/utils/developer-dashboard/sortSupportedPolicies';

interface EditAppVersionToolButtonProps {
  appId: number;
  versionId: number;
  tool: AppVersionTool;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAppVersionToolButton({
  appId,
  versionId,
  tool,
  onSuccess,
  onCancel,
}: EditAppVersionToolButtonProps) {
  // Fetching
  const {
    data: allPolicies,
    isLoading: isLoadingPolicies,
    isError: isErrorPolicies,
  } = vincentApiClient.useListAllPoliciesQuery();

  const {
    data: toolVersionData,
    isLoading: isLoadingToolVersion,
    isError: isErrorToolVersion,
  } = vincentApiClient.useGetToolVersionQuery({
    packageName: tool.toolPackageName,
    version: tool.toolVersion,
  });

  // Mutation
  const [editAppVersionTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditAppVersionToolMutation();

  // Effect
  useEffect(() => {
    if (!isSuccess || !data) return;
    const timer = setTimeout(() => {
      onSuccess();
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSuccess, data, onSuccess]);

  // Loading states
  if (isLoadingPolicies || isLoadingToolVersion)
    return <StatusMessage message="Loading..." type="info" />;
  if (isErrorPolicies) return <StatusMessage message="Failed to load policies" type="error" />;
  if (isErrorToolVersion)
    return <StatusMessage message="Failed to load tool version data" type="error" />;

  // Early return if data is not available
  if (!toolVersionData) {
    return <StatusMessage message="Tool version data not available" type="error" />;
  }

  const supportedPolicies = sortedSupportedPolicies(allPolicies || [], toolVersionData);

  // Mutation
  if (isLoading) {
    return <StatusMessage message="Updating tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAppVersionToolFormData) => {
    await editAppVersionTool({
      appId,
      appVersion: versionId,
      toolPackageName: tool.toolPackageName,
      appVersionToolEdit: data,
    });
  };

  return (
    <EditAppVersionToolForm
      tool={tool}
      policies={supportedPolicies}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isLoading}
    />
  );
}
