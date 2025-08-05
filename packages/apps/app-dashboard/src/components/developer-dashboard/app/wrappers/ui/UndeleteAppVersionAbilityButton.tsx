import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { ArchiveRestore } from 'lucide-react';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';

interface UndeleteAppVersionAbilityWrapperProps {
  appVersionAbility: AppVersionAbility;
}

export function UndeleteAppVersionAbilityButton({
  appVersionAbility,
}: UndeleteAppVersionAbilityWrapperProps) {
  // Mutation
  const [undeleteAppVersionAbility, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useUndeleteAppVersionAbilityMutation();

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (!appVersionAbility)
    return <StatusMessage message={`App version ability not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Undeleting app version ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App version ability undeleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to undelete app version ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await undeleteAppVersionAbility({
      appId: appVersionAbility.appId,
      appVersion: appVersionAbility.appVersion,
      abilityPackageName: appVersionAbility.abilityPackageName,
    });
  };

  return (
    <button
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-green-200 dark:border-green-500/30 rounded-lg text-sm font-medium text-green-600 dark:text-green-400 bg-white dark:bg-neutral-800 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors relative z-10 !opacity-100 shadow-sm"
    >
      <ArchiveRestore className="h-4 w-4" />
      Undelete Ability
    </button>
  );
}
