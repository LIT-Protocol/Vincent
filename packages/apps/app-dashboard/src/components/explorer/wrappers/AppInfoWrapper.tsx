import { useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppInfoView } from '../views/AppInfoView';
import LoadingLock from '@/components/shared/ui/LoadingLock';
import { ExplorerErrorPage } from '../ui/ExplorerErrorPage';
import { ExplorerNav } from '../ui/ExplorerNav';

export function AppInfoWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetch app data
  const {
    data: app,
    isLoading,
    isError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetch version abilities
  const {
    data: versionAbilities,
    isLoading: versionAbilitysLoading,
    isError: versionAbilitysError,
  } = vincentApiClient.useListAppVersionAbilitiesQuery(
    {
      appId: Number(appId),
      version: app?.activeVersion || 0,
    },
    {
      skip: !app?.activeVersion,
    },
  );

  if (isLoading || versionsLoading || versionAbilitysLoading) {
    console.log('[AppInfoWrapper] Rendering loading state');
    return (
      <div className="w-full relative">
        <ExplorerNav />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)', paddingTop: '4rem' }}
        >
          <LoadingLock />
        </div>
      </div>
    );
  }

  // Handle main app loading error
  if (isError) {
    return (
      <ExplorerErrorPage
        title="Failed to Load App"
        message="We couldn't load the application details. This might be due to a network issue or the app may no longer exist."
      />
    );
  }

  // Handle versions loading error
  if (versionsError) {
    return (
      <ExplorerErrorPage
        title="Failed to Load App Versions"
        message="We couldn't load the version history for this application."
      />
    );
  }

  // Handle version abilities loading error
  if (versionAbilitysError) {
    return (
      <ExplorerErrorPage
        title="Failed to Load Version Abilities"
        message="We couldn't load the capabilities for this app version."
      />
    );
  }

  // Handle missing data
  if (!app) {
    return (
      <ExplorerErrorPage
        title="App Not Found"
        message={`Application ${appId} could not be found. It may have been removed or the ID is incorrect.`}
      />
    );
  }

  if (!versions) {
    return (
      <ExplorerErrorPage
        title="No Versions Available"
        message="This application has no version information available."
      />
    );
  }

  if (!versionAbilities) {
    return (
      <ExplorerErrorPage
        title="Version Capabilities Unavailable"
        message="The capabilities for this app version are not available."
      />
    );
  }

  return <AppInfoView app={app} versions={versions} versionAbilities={versionAbilities} />;
}
