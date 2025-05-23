import { useEffect } from 'react';
import { AppView, ContractVersionResult } from '@/types';

interface UseAutoParameterUpdateProps {
  showUpdateModal: boolean;
  appInfo: AppView | null;
  permittedVersion: number | null;
  isLoading: boolean;
  versionInfo: ContractVersionResult | null;
  handleUpdateParameters: () => void;
}

/**
 * Hook to automatically update parameters for returning users
 *
 * This hook handles the special case when a user returns to an app they've already
 * authorized. It triggers parameter updates to put the form in "update only" mode
 * rather than "new permission" mode.
 *
 * @param showUpdateModal - Flag indicating the user is returning to an authorized app
 * @param appInfo - Information about the app
 * @param permittedVersion - The version the user has previously authorized
 * @param isLoading - Whether data is currently loading
 * @param versionInfo - Information about the app version
 * @param handleUpdateParameters - Function to update parameters
 */
export function useAutoParameterUpdate({
  showUpdateModal,
  appInfo,
  permittedVersion,
  isLoading,
  versionInfo,
  handleUpdateParameters,
}: UseAutoParameterUpdateProps) {
  useEffect(() => {
    if (!showUpdateModal || !appInfo || permittedVersion === null || isLoading) {
      return;
    }

    const isPermittedVersionEnabled =
      versionInfo &&
      Number(versionInfo.appVersion.version) === permittedVersion &&
      versionInfo.appVersion.enabled;

    if (isPermittedVersionEnabled !== false) {
      handleUpdateParameters();
    }
  }, [showUpdateModal, appInfo, permittedVersion, isLoading, versionInfo, handleUpdateParameters]);
}
