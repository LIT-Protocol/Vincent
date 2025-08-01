import { useEffect } from 'react';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  EditAppVersionAbilityForm,
  type EditAppVersionAbilityFormData,
} from '../../forms/EditAppVersionAbilityForm.tsx';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { sortedSupportedPolicies } from '@/utils/developer-dashboard/sortSupportedPolicies';

interface EditAppVersionAbilityButtonProps {
  appId: number;
  versionId: number;
  ability: AppVersionAbility;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAppVersionAbilityButton({
  appId,
  versionId,
  ability,
  onSuccess,
  onCancel,
}: EditAppVersionAbilityButtonProps) {
  // Fetching
  const {
    data: allPolicies,
    isLoading: isLoadingPolicies,
    isError: isErrorPolicies,
  } = vincentApiClient.useListAllPoliciesQuery();

  const {
    data: abilityVersionData,
    isLoading: isLoadingAbilityVersion,
    isError: isErrorAbilityVersion,
  } = vincentApiClient.useGetAbilityVersionQuery({
    packageName: ability.abilityPackageName,
    version: ability.abilityVersion,
  });

  // Mutation
  const [editAppVersionAbility, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useEditAppVersionAbilityMutation();

  // Effect
  useEffect(() => {
    if (!isSuccess || !data) return;
    const timer = setTimeout(() => {
      onSuccess();
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSuccess, data, onSuccess]);

  // Loading states
  if (isLoadingPolicies || isLoadingAbilityVersion)
    return <StatusMessage message="Loading..." type="info" />;
  if (isErrorPolicies) return <StatusMessage message="Failed to load policies" type="error" />;
  if (isErrorAbilityVersion)
    return <StatusMessage message="Failed to load ability version data" type="error" />;

  // Early return if data is not available
  if (!abilityVersionData) {
    return <StatusMessage message="Ability version data not available" type="error" />;
  }

  const supportedPolicies = sortedSupportedPolicies(allPolicies || [], abilityVersionData);

  // Mutation
  if (isLoading) {
    return <StatusMessage message="Updating ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAppVersionAbilityFormData) => {
    await editAppVersionAbility({
      appId,
      appVersion: versionId,
      abilityPackageName: ability.abilityPackageName,
      appVersionAbilityEdit: data,
    });
  };

  return (
    <EditAppVersionAbilityForm
      ability={ability}
      policies={supportedPolicies}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isLoading}
    />
  );
}
