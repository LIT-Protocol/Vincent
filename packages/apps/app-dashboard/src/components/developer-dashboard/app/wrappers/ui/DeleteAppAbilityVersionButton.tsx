import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Trash2 } from 'lucide-react';

interface DeleteAppVersionAbilityButtonProps {
  appId: number;
  versionId: number;
  ability: AppVersionAbility;
}

export function DeleteAppVersionAbilityButton({
  appId,
  versionId,
  ability,
}: DeleteAppVersionAbilityButtonProps) {
  // Mutation
  const [deleteAppVersionAbility, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAppVersionAbilityMutation();

  // Mutation
  if (isLoading) {
    return <StatusMessage message="Deleting ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deleteAppVersionAbility({
      appId,
      appVersion: versionId,
      abilityPackageName: ability.abilityPackageName,
    });
  };

  return (
    <button
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Delete Ability
    </button>
  );
}
