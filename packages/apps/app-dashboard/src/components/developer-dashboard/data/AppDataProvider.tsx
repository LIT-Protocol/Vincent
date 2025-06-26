import { useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDeveloperData } from '@/contexts/DeveloperDataContext';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import AppEdit from '@/pages/developer-dashboard/app/AppEdit';
import AppOverview from '@/pages/developer-dashboard/app/AppOverview';
import AppDelete from '@/pages/developer-dashboard/app/AppDelete';
import CreateAppPage from '@/pages/developer-dashboard/app/CreateAppPage';
import AppVersions from '@/pages/developer-dashboard/app/AppVersions';
import AppVersionDetail from '@/pages/developer-dashboard/app/AppVersionDetail';
import AppVersionTools from '@/pages/developer-dashboard/app/AppVersionTools';
import AppCreateVersion from '@/pages/developer-dashboard/app/AppCreateVersion';
import AppEditVersion from '@/pages/developer-dashboard/app/AppEditVersion';

/**
 * App Route Component - Uses unified data context and provides app-specific data as props
 */
export function AppRoute() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const location = useLocation();

  // Use unified data context for apps and version hooks
  const {
    userApps: apps,
    allTools,
    isLoading,
    hasErrors,
    refetchApps,
    useAppVersions,
    useAppVersion,
    useListAppVersionToolsQuery,
  } = useDeveloperData();

  // Get Vincent API for mutations
  const vincentApi = useVincentApiWithSIWE();
  const [createAppVersionTool] = vincentApi.useCreateAppVersionToolMutation();

  // Find specific app for app-specific routes
  const app = useMemo(() => {
    return appId ? apps.find((app) => app.appId === Number(appId)) || null : null;
  }, [apps, appId]);

  // Use version hooks when we have appId (for version-level routes)
  const {
    data: appVersions,
    isLoading: versionsLoading,
    error: versionsError,
    refetch: refetchVersions,
  } = useAppVersions({ appId: Number(appId!) }, { skip: !appId });

  // Use specific version hook when we have both appId and versionId
  const {
    data: versionData,
    isLoading: versionLoading,
    error: versionError,
    refetch: refetchVersionData,
  } = useAppVersion(
    { appId: Number(appId!), version: Number(versionId!) },
    { skip: !appId || !versionId },
  );

  // Use version tools hook when we have both appId and versionId
  const {
    data: versionTools,
    isLoading: versionToolsLoading,
    error: versionToolsError,
    refetch: refetchVersionTools,
  } = useListAppVersionToolsQuery(
    { appId: Number(appId!), version: Number(versionId!) },
    { skip: !appId || !versionId },
  );

  // Handle tool addition at the data layer
  const handleToolAdd = async (tool: any) => {
    if (!appId || !versionId) {
      throw new Error('App ID and Version ID are required');
    }

    const response = await createAppVersionTool({
      appId: Number(appId),
      appVersion: Number(versionId),
      toolPackageName: tool.packageName,
      appVersionToolCreate: {
        toolVersion: tool.activeVersion,
        hiddenSupportedPolicies: [],
      },
    });

    if ('error' in response) {
      throw new Error('Failed to add tool');
    }

    // Refetch version tools to update the cache
    await refetchVersionTools();
  };

  // Loading and error states for app data
  if (isLoading) return <Loading />;
  if (hasErrors) return <StatusMessage message="Failed to load apps" type="error" />;

  // Handle create-app route (no appId needed)
  if (!appId) {
    return <CreateAppPage refetchApps={refetchApps} />;
  }

  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Version-level routes (when versionId is present)
  if (versionId) {
    // Loading state for version data
    if (versionLoading || versionsLoading || versionToolsLoading) return <Loading />;

    // Error handling for version data
    if (versionError || versionsError || versionToolsError) {
      return <StatusMessage message="Error loading version data" type="error" />;
    }

    if (!versionData) {
      return <StatusMessage message={`Version ${versionId} not found`} type="error" />;
    }

    // Route based on URL path
    if (location.pathname.endsWith('/edit')) {
      return (
        <AppEditVersion
          app={app}
          versionData={versionData}
          refetchVersions={refetchVersions}
          refetchVersionData={refetchVersionData}
        />
      );
    }

    if (location.pathname.endsWith('/tools')) {
      return (
        <AppVersionTools
          app={app}
          versionId={Number(versionId)}
          versionTools={versionTools || []}
          refetchVersionTools={refetchVersionTools}
          onToolAdd={handleToolAdd}
          availableTools={allTools}
        />
      );
    }

    // Default version detail view
    return (
      <AppVersionDetail
        app={app}
        versionData={versionData}
        versionTools={versionTools || []}
        refetchVersions={refetchVersions}
        refetchVersionData={refetchVersionData}
      />
    );
  }

  // App-level routes (when no versionId) - route based on URL path
  if (location.pathname.endsWith('/edit-app')) {
    return <AppEdit app={app} appVersions={appVersions || []} refetchApps={refetchApps} />;
  }

  if (location.pathname.endsWith('/delete-app')) {
    return <AppDelete app={app} refetchApps={refetchApps} />;
  }

  if (location.pathname.endsWith('/versions')) {
    return <AppVersions app={app} appVersions={appVersions || []} />;
  }

  if (location.pathname.endsWith('/create-app-version')) {
    return <AppCreateVersion app={app} refetchVersions={refetchVersions} />;
  }

  // Default app overview
  return <AppOverview app={app} />;
}
