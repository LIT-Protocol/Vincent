import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Trash2 } from 'lucide-react';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { StatusMessage } from '@/components/shared/ui/statusMessage';

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
  const [showStatus, setShowStatus] = useState<'success' | 'error' | null>(null);

  // Mutation
  const [deleteAppVersionAbility, { isLoading, isSuccess, isError, error }] =
    vincentApiClient.useDeleteAppVersionAbilityMutation();

  useEffect(() => {
    if (isSuccess) {
      setShowStatus('success');
      const timer = setTimeout(() => setShowStatus(null), 2000);
      return () => clearTimeout(timer);
    }
    if (isError) {
      setShowStatus('error');
      const timer = setTimeout(() => setShowStatus(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isSuccess, isError]);

  const handleSubmit = async () => {
    await deleteAppVersionAbility({
      appId,
      appVersion: versionId,
      abilityPackageName: ability.abilityPackageName,
    });
  };

  if (showStatus === 'success') {
    return <StatusMessage message="Deleted!" type="success" />;
  }

  if (showStatus === 'error') {
    const errorMessage = getErrorMessage(
      error as FetchBaseQueryError | SerializedError | undefined,
      'Failed to delete',
    );
    return <StatusMessage message={errorMessage} type="error" />;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSubmit}
      disabled={isLoading}
      className="h-8 px-3 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
    >
      {isLoading ? (
        <>
          <div className="h-3 w-3 mr-1 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </>
      )}
    </Button>
  );
}
