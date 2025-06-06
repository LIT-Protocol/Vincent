import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';
import { AppViewType } from '@/types/app-dashboard/viewTypes';

interface UseAppDataProps {
  appId: number;
  viewType: AppViewType;
  versionId: number | null;
}

export function useAppData({ appId, viewType, versionId }: UseAppDataProps) {
  // Always fetch app data as it's needed for all views
  const {
    data: app,
    error: appError,
    isLoading: appLoading,
  } = vincentApiClient.useGetAppQuery({ appId }, { skip: !appId });

  // Only fetch versions when on versions view
  const {
    data: versions,
    error: versionsError,
    isLoading: versionsLoading,
  } = vincentApiClient.useGetAppVersionsQuery(
    { appId },
    { skip: !appId || viewType !== AppViewType.APP_VERSIONS },
  );

  // Only fetch version data when on version view
  const {
    data: versionData,
    error: versionError,
    isLoading: versionLoading,
  } = vincentApiClient.useGetAppVersionQuery(
    { appId, version: versionId || 0 },
    { skip: !appId || !versionId || viewType !== AppViewType.APP_VERSION },
  );

  return {
    app,
    appError,
    appLoading,
    versions,
    versionsError,
    versionsLoading,
    versionData,
    versionError,
    versionLoading,
  };
}
